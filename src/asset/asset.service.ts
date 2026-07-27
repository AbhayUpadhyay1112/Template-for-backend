import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssetDto) {
    const chain = await this.prisma.chain.findUnique({
      where: { id: dto.chainId },
    });

    if (!chain) {
      throw new NotFoundException(`Chain with id ${dto.chainId} not found`);
    }

    try {
      return await this.prisma.asset.create({
        data: {
          assetName: dto.assetName,
          chainId: dto.chainId,
          address: dto.address,
          isNative: dto.isNative,
          status: dto.status,
          createdBy: dto.createdBy,
        },
        include: {
          chain: true,
        },
      });
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
      data,
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

    return asset;
  }

  async update(id: number, dto: UpdateAssetDto) {
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
      return await this.prisma.asset.update({
        where: { id },
        data: dto,
        include: {
          chain: true,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.asset.delete({
      where: { id },
    });
  }
}
