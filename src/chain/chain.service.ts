import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChainDto } from './dto/create-chain.dto';
import { UpdateChainDto } from './dto/update-chain.dto';
import { ChainResponseDto } from './dto/chain-response.dto';

@Injectable()
export class ChainService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChainDto, userId: number) {
    try {
      const chain = await this.prisma.chain.create({
        data: {
          chainId: dto.chainId,
          chainName: dto.chainName,
          rpc: dto.rpc,
          fallbackRpc: dto.fallbackRpc,
          status: dto.status,
          createdBy: userId,
        },
      });

      return this.toResponse(chain);
    } catch (err) {
      throw err;
    }
  }

  private toResponse(chain: any): ChainResponseDto {
    return {
      id: chain.id,
      chainId: chain.chainId,
      chainName: chain.chainName,
      status: chain.status,
      createdBy: chain.createdBy,
      createdAt: chain.createdAt,
      updatedBy: chain.updatedBy,
      updatedAt: chain.updatedAt,
    };
  }
  async findAll() {
    const data = await this.prisma.chain.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      count: data.length,
      data: data.map((chain) => this.toResponse(chain)),
    };
  }

  async findOne(id: number) {
    const chain = await this.prisma.chain.findUnique({
      where: { id },
    });

    if (!chain) {
      throw new NotFoundException(`Chain with id ${id} not found`);
    }

    return this.toResponse(chain);
  }
  async update(id: number, dto: UpdateChainDto, userId: number) {
    await this.findOne(id);

    try {
      const chain = await this.prisma.chain.update({
        where: { id },
        data: {
          ...dto,
          updatedBy: userId,
        },
      });

      return this.toResponse(chain);
    } catch (err) {
      throw err;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    const deleted = await this.prisma.chain.delete({
      where: { id },
    });

    return this.toResponse(deleted);
  }
}
