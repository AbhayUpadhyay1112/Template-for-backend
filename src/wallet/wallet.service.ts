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

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly KMSEVMSigner: KMSEVMSigner,
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
    const platform = await this.prisma.platform.findUnique({
      where: { id: dto.platformId },
    });

    if (!platform) {
      throw new NotFoundException(
        `Platform with id ${dto.platformId} not found`,
      );
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with id ${dto.assetId} not found`);
    }

    try {
      const wallet = await this.prisma.wallet.create({
        data: {
          name: dto.walletName,
          walletAddress: dto.walletAddress,
          platformId: dto.platformId,
          purpose: dto.purpose,
          assetId: dto.assetId,
          status: dto.status,
          createdBy: userId,
        },
        include: {
          platform: true,
          asset: {
            include: {
              chain: true,
            },
          },
        },
      });
      return this.formatWalletResponse(wallet);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async findAll() {
    const data = await this.prisma.wallet.findMany({
      include: {
        platform: true,
        asset: {
          include: {
            chain: true,
          },
        },
      },
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
      include: {
        platform: true,
        asset: {
          include: {
            chain: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with id ${id} not found`);
    }

    return this.formatWalletResponse(wallet);
  }

  async update(id: number, dto: UpdateWalletDto, userId: number) {
    await this.findOne(id);

    if (dto.platformId !== undefined) {
      const platform = await this.prisma.platform.findUnique({
        where: { id: dto.platformId },
      });

      if (!platform) {
        throw new NotFoundException(
          `Platform with id ${dto.platformId} not found`,
        );
      }
    }

    if (dto.assetId !== undefined) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: dto.assetId },
      });

      if (!asset) {
        throw new NotFoundException(`Asset with id ${dto.assetId} not found`);
      }
    }

    try {
      const wallet = await this.prisma.wallet.update({
        where: { id },
        data: {
          name: dto.walletName,
          walletAddress: dto.walletAddress,
          platformId: dto.platformId,
          purpose: dto.purpose,
          assetId: dto.assetId,
          status: dto.status,
          updatedBy: userId,
        },
        include: {
          platform: true,
          asset: {
            include: {
              chain: true,
            },
          },
        },
      });
      return this.formatWalletResponse(wallet);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      const wallet = await this.prisma.wallet.delete({
        where: { id },
        include: {
          platform: true,
          asset: {
            include: {
              chain: true,
            },
          },
        },
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

  async signTransaction(dto: CreateTransactionDto) {
    const chainDetails = await this.prisma.chain.findUnique({
      where: { id: dto.chainId },
    });

    if (!chainDetails) {
      throw new NotFoundException(`Chain with id ${dto.chainId} not found`);
    }
    const { rpc, chainId } = chainDetails;

    const txHash = await this.KMSEVMSigner.sendRawTransaction({
      rpcUrl: rpc,
      to: dto.to,
      value: BigInt(dto.value),
      data: dto.data || '0x',
      chainId: chainId,
    });

    return { txHash };
  }
}
