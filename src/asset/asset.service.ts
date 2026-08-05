import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  private formatAssetResponse(asset: any) {
    if (!asset) return asset;
    if (asset.chain) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rpc, fallbackRpc, ...chainWithoutRpc } = asset.chain;
      return {
        ...asset,
        chain: chainWithoutRpc,
      };
    }
    return asset;
  }

  async create(dto: CreateAssetDto, userId: number) {
    const chain = await this.prisma.chain.findUnique({
      where: { id: dto.chainId },
    });

    if (!chain) {
      throw new NotFoundException(`Chain with id ${dto.chainId} not found`);
    }

    try {
      const asset = await this.prisma.asset.create({
        data: {
          assetName: dto.assetName,
          chainId: dto.chainId,
          address: dto.address,
          isNative: dto.isNative,
          status: dto.status,
          createdBy: userId,
        },
        include: {
          chain: true,
        },
      });
      return this.formatAssetResponse(asset);
    } catch (err) {
      throw err;
    }
  }

  async findAll() {
    const data = await this.prisma.asset.findMany({
      include: {
        chain: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      count: data.length,
      data: data.map((asset) => this.formatAssetResponse(asset)),
    };
  }

  async findOne(id: number) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        chain: true,
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with id ${id} not found`);
    }

    return this.formatAssetResponse(asset);
  }

  async update(id: number, dto: UpdateAssetDto, userId: number) {
    await this.findOne(id);

    if (dto.chainId !== undefined) {
      const chain = await this.prisma.chain.findUnique({
        where: { id: dto.chainId },
      });

      if (!chain) {
        throw new NotFoundException(`Chain with id ${dto.chainId} not found`);
      }
    }

    try {
      const asset = await this.prisma.asset.update({
        where: { id },
        data: {
          ...dto,
          updatedBy: userId,
        },
        include: {
          chain: true,
        },
      });
      return this.formatAssetResponse(asset);
    } catch (err) {
      throw err;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      const asset = await this.prisma.asset.delete({
        where: { id },
        include: {
          chain: true,
        },
      });
      return this.formatAssetResponse(asset);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'This asset cannot be deleted because it has dependent wallets. Remove the dependencies first and try again.',
        );
      }
      throw error;
    }
  }
}
