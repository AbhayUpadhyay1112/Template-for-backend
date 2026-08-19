import {
  KMSClient,
  GetPublicKeyCommand,
  SignCommand,
} from '@aws-sdk/client-kms';
import {
  Transaction,
  Signature,
  JsonRpcProvider,
  TransactionRequest,
  keccak256,
  recoverAddress,
} from 'ethers';
import BN from 'bn.js';
import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { kmsEvmConigFactory } from '@Config';
import { ConfigType } from '@nestjs/config';

const SECP256K1_N = new BN(
  'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
  16,
);
const HALF_N = SECP256K1_N.shrn(1);

export interface SignTransactionParams {
  to: string;
  value?: bigint;
  data?: string;
  chainId?: number;
  nonce?: number;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface SendRawTransactionParams extends SignTransactionParams {
  rpcUrl: string;
  awsKeyId: string;
}

interface KmsSignDigestParams {
  digestBuf: Buffer;
  expectedAddress: string;
  keyId: string;
}

interface DerSignature {
  r: BN;
  s: BN;
}

@Injectable()
export class KMSEVMSigner {
  constructor(
    @Inject(kmsEvmConigFactory.KEY)
    private readonly config: ConfigType<typeof kmsEvmConigFactory>,
  ) {}
  // ---- KMS client cache (avoid re-creating per instance/call) ----
  private static readonly clientCache = new Map<string, KMSClient>();

  private getKmsClient(): KMSClient {
    if (!KMSEVMSigner.clientCache.has(this.config.region)) {
      KMSEVMSigner.clientCache.set(
        this.config.region || '',
        new KMSClient({
          region: this.config.region,
          credentials: {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
          },
        }),
      );
    }
    return KMSEVMSigner.clientCache.get(this.config.region)!;
  }

  private handleKmsError(error: any): never {
    const message = error?.message || '';
    const name = error?.name || '';

    if (
      name === 'AccessDeniedException' ||
      name === 'UnauthorizedException' ||
      message.includes('is not authorized to perform: kms:') ||
      message.includes('AccessDenied') ||
      message.includes('not authorized to perform')
    ) {
      throw new ForbiddenException(
        'Access denied: You don’t have permission to use this encrypted key.',
      );
    }

    throw error;
  }

  /**
   * Derive the Ethereum address controlled by this KMS key.
   */
  async getAddress(customKeyID?: string): Promise<string> {
    try {
      const kms = this.getKmsClient();
      const res = await kms.send(
        new GetPublicKeyCommand({ KeyId: customKeyID || this.config.KEY_ID }),
      );

      if (!res.PublicKey) {
        throw new Error('KMS did not return a public key');
      }

      const derPubKey = Buffer.from(res.PublicKey);
      const rawPubKey = derPubKey.slice(-65); // uncompressed EC point
      const pubKeyNoPrefix = rawPubKey.slice(1); // drop 0x04 prefix
      const hash = keccak256(pubKeyNoPrefix);
      return '0x' + hash.slice(-40);
    } catch (err) {
      this.handleKmsError(err);
    }
  }

  private parseDerSignature(der: Buffer): DerSignature {
    let offset = 2; // skip SEQUENCE header
    offset++; // INTEGER tag for r
    const rLen = der[offset++];
    const r = new BN(der.slice(offset, offset + rLen));
    offset += rLen;
    offset++; // INTEGER tag for s
    const sLen = der[offset++];
    const s = new BN(der.slice(offset, offset + sLen));
    return { r, s };
  }

  private normalizeS(s: BN): BN {
    return s.gt(HALF_N) ? SECP256K1_N.sub(s) : s;
  }

  /**
   * Sign a 32-byte digest with KMS and return an ethers-compatible Signature,
   * recovered against the expected address.
   */
  private async kmsSignDigest({
    digestBuf,
    expectedAddress,
    keyId,
  }: KmsSignDigestParams): Promise<Signature> {
    let signRes;
    try {
      const kms = this.getKmsClient();

      signRes = await kms.send(
        new SignCommand({
          KeyId: keyId || this.config.KEY_ID,
          Message: digestBuf,
          MessageType: 'DIGEST',
          SigningAlgorithm: 'ECDSA_SHA_256',
        }),
      );
    } catch (err) {
      this.handleKmsError(err);
    }

    if (!signRes.Signature) {
      throw new Error('KMS did not return a signature');
    }

    const { r, s } = this.parseDerSignature(Buffer.from(signRes.Signature));
    const sNorm = this.normalizeS(s);

    for (const recid of [0, 1]) {
      const candidate = Signature.from({
        r: '0x' + r.toString(16).padStart(64, '0'),
        s: '0x' + sNorm.toString(16).padStart(64, '0'),
        v: 27 + recid,
      });
      try {
        const recovered = recoverAddress(digestBuf, candidate);
        if (recovered.toLowerCase() === expectedAddress.toLowerCase()) {
          return candidate;
        }
      } catch (e_) {
        console.log(e_);
      }
    }
    throw new Error('KMS signature did not recover to the expected address');
  }

  /**
   * Build, sign (via KMS), and return a fully signed raw transaction hex string.
   * Does not broadcast.
   */
  async signTransaction(
    provider: JsonRpcProvider,
    {
      to,
      value = 0n,
      data = '0x',
      chainId,
      nonce,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    }: SignTransactionParams,
    customKeyID?: string,
  ): Promise<string> {
    const address = await this.getAddress(customKeyID);

    const resolvedNonce =
      nonce ?? (await provider.getTransactionCount(address, 'pending'));

    let fees = { maxFeePerGas, maxPriorityFeePerGas };
    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      const feeData = await provider.getFeeData();
      fees = {
        maxFeePerGas:
          maxFeePerGas ??
          ((feeData.maxFeePerGas ?? undefined) as bigint | undefined),
        maxPriorityFeePerGas:
          maxPriorityFeePerGas ??
          ((feeData.maxPriorityFeePerGas ?? undefined) as bigint | undefined),
      };
    }

    const resolvedGasLimit =
      gasLimit ??
      (await provider.estimateGas({
        to,
        value,
        data,
        from: address,
      } as TransactionRequest));

    const tx = Transaction.from({
      to,
      value,
      data,
      nonce: resolvedNonce,
      gasLimit: resolvedGasLimit,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      chainId,
      type: 2, // EIP-1559
    });

    const digestHex = keccak256(tx.unsignedSerialized).slice(2);
    const digestBuf = Buffer.from(digestHex, 'hex');

    const signature = await this.kmsSignDigest({
      digestBuf,
      expectedAddress: address,
      keyId: customKeyID || this.config.KEY_ID,
    });

    tx.signature = signature;
    return tx.serialized; // signed raw tx hex, ready to broadcast
  }

  async sendRawTransaction({
    rpcUrl,
    to,
    value = 0n,
    data = '0x',
    chainId,
    nonce,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    awsKeyId,
  }: SendRawTransactionParams): Promise<string> {
    const provider = new JsonRpcProvider(rpcUrl);

    const resolvedChainId =
      chainId ?? Number((await provider.getNetwork()).chainId);

    const signedRawTx = await this.signTransaction(
      provider,
      {
        to,
        value,
        data,
        chainId: resolvedChainId,
        nonce,
        gasLimit,
        maxFeePerGas: maxFeePerGas ? maxFeePerGas : this.config.maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
          ? maxPriorityFeePerGas
          : this.config.maxPriorityFeePerGas,
      },
      awsKeyId,
    );

    const txResponse = await provider.broadcastTransaction(signedRawTx);
    const receipt = await txResponse.wait();
    if (receipt?.hash) {
      return receipt.hash;
    }

    throw new Error('Transaction not succeeded');
  }
}
