import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWalletDto) {
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
      return await this.prisma.wallet.create({
        data: {
          platformId: dto.platformId,
          purpose: dto.purpose,
          assetId: dto.assetId,
          status: dto.status,
          createdBy: dto.createdBy,
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
    } catch (err) {
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
      data,
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

    return wallet;
  }

  async update(id: number, dto: UpdateWalletDto) {
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
      return await this.prisma.wallet.update({
        where: { id },
        data: dto,
        include: {
          platform: true,
          asset: {
            include: {
              chain: true,
            },
          },
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.wallet.delete({
      where: { id },
    });
  }
}
