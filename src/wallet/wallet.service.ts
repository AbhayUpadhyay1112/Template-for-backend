import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { KMSEVMSigner } from 'src/kms-evm-signer';
import { WalletActionDTO } from './dto/wallet-action.dto';
import { ethers } from 'ethers';
import { UtilsService } from '@Common';
type CallMetaData = {
  contractAddress: string;
  abi: Record<string, unknown>;
  defaultValues?: any;
};
@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly KMSEVMSigner: KMSEVMSigner,
    private readonly utilsService: UtilsService,
  ) {}

  private formatWalletResponse(wallet: any) {
    if (!wallet) return wallet;
    if (wallet.asset?.chain) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rpc, fallbackRpc, ...chainWithoutRpc } = wallet.asset.chain;
      return {
        ...wallet,
        asset: {
          ...wallet.asset,
          chain: chainWithoutRpc,
        },
      };
    }
    return wallet;
  }

  async create(dto: CreateWalletDto, userId: number) {
    try {
      const wallet = await this.prisma.wallet.create({
        data: {
          name: dto.walletName,
          walletAddress: dto.walletAddress,
          awsKeyID: dto.awsKeyID,
          status: dto.status,
          createdBy: userId,
        },
      });
      return this.formatWalletResponse(wallet);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          'This AWS Key ID is already assigned to another wallet. Each wallet must have a unique AWS KMS Key.',
        );
      }
      console.log(err);
      throw err;
    }
  }

  async findAll() {
    const data = await this.prisma.wallet.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      count: data.length,
      data: data.map((wallet) => this.formatWalletResponse(wallet)),
    };
  }

  async findOne(id: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with id ${id} not found`);
    }

    return this.formatWalletResponse(wallet);
  }

  async update(id: number, dto: UpdateWalletDto, userId: number) {
    await this.findOne(id);

    try {
      const wallet = await this.prisma.wallet.update({
        where: { id },
        data: {
          name: dto.walletName,
          walletAddress: dto.walletAddress,
          awsKeyID: dto.awsKeyID,
          status: dto.status,
          updatedBy: userId,
        },
      });
      return this.formatWalletResponse(wallet);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          'This AWS Key ID is already assigned to another wallet. Each wallet must have a unique AWS KMS Key.',
        );
      }
      console.log(err);
      throw err;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      const wallet = await this.prisma.wallet.delete({
        where: { id },
      });

      return this.formatWalletResponse(wallet);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'This wallet cannot be deleted because it has dependent actions. Remove the dependencies first and try again.',
        );
      }
      throw error;
    }
  }

  // async signTransaction(dto: CreateTransactionDto) {
  //   const chainDetails = await this.prisma.chain.findUnique({
  //     where: { id: dto.chainId },
  //   });

  //   if (!chainDetails) {
  //     throw new NotFoundException(`Chain with id ${dto.chainId} not found`);
  //   }
  //   const { rpc, chainId } = chainDetails;

  //   const txHash = await this.KMSEVMSigner.sendRawTransaction({
  //     rpcUrl: rpc,
  //     to: dto.to,
  //     value: BigInt(dto.value),
  //     data: dto.data || '0x',
  //     chainId: chainId,
  //   });

  //   return { txHash };
  // }

  async action(dto: WalletActionDTO) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: dto.walletId },
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet with id ${dto.walletId} not found`);
    }
    const action = await this.prisma.action.findUnique({
      where: { id: dto.actionId },
    });
    if (!action) {
      throw new NotFoundException(`Action with id ${dto.actionId} not found`);
    }
    const { chainID } = action;
    const chain = await this.prisma.chain.findUnique({
      where: { id: chainID },
    });
    if (!chain) {
      throw new NotFoundException(`Chain with id ${chainID} not found`);
    }
    //create provider
    const { rpc } = chain;
    const provider = new ethers.JsonRpcProvider(rpc);
    //check actionType
    let callMetaData = action.callMetaData as CallMetaData;

    //check if CallMetaData is String or JSON, if String Parse JSON
    if (
      callMetaData == null &&
      this.utilsService.isJSONString(callMetaData as unknown as string)
    ) {
      throw new NotFoundException(
        `Action was Created with wrong Call Meta data was not as per standard`,
      );
    }
    if (typeof callMetaData == 'string') {
      callMetaData = JSON.parse(callMetaData);
    }
    if (!callMetaData.contractAddress) {
      throw new NotFoundException(
        `Action was Created with wrong Call Meta data, Contract Address Not found`,
      );
    }
    if (!callMetaData.abi) {
      throw new NotFoundException(
        `Action was Created with wrong Call Meta data, Contract Address Not found`,
      );
    }

    if (action.actionType === 'Read') {
      const contractObject = new ethers.Contract(
        callMetaData.contractAddress,
        [callMetaData.abi],
        provider,
      );
      const callData = contractObject.interface.encodeFunctionData(
        callMetaData.abi.name as string,
        dto.data,
      );
      const data = await provider.call({
        to: callMetaData.contractAddress,
        data: callData,
      });
      const response = await contractObject.interface.decodeFunctionResult(
        callMetaData.abi.name as string,
        data,
      );
      return { status: true, response };
    } else if (action.actionType === 'Write') {
      //handle write actions

      const contractObject = new ethers.Contract(
        callMetaData.contractAddress,
        [callMetaData.abi],
        provider,
      );
      const callData = contractObject.interface.encodeFunctionData(
        callMetaData.abi.name as string,
        dto.data,
      );

      const sendTransaction = await this.KMSEVMSigner.sendRawTransaction({
        rpcUrl: rpc,
        to: callMetaData.contractAddress,
        value: 0n,
        data: callData,
        chainId: chain.chainId,
        awsKeyId: wallet?.awsKeyID || '',
      });

      return { status: true, transaction: sendTransaction };
    }
  }
}
