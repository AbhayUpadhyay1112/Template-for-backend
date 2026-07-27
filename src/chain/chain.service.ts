import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChainDto } from './dto/create-chain.dto';
import { UpdateChainDto } from './dto/update-chain.dto';

@Injectable()
export class ChainService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChainDto) {
    try {
      return await this.prisma.chain.create({
        data: {
          chainName: dto.chainName,
          rpc: dto.rpc,
          fallbackRpc: dto.fallbackRpc,
          status: dto.status,
          createdBy: dto.createdBy,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async findAll() {
    const data = await this.prisma.chain.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      count: data.length,
      data,
    };
  }

  async findOne(id: number) {
    const chain = await this.prisma.chain.findUnique({
      where: { id },
    });

    if (!chain) {
      throw new NotFoundException(`Chain with id ${id} not found`);
    }

    return chain;
  }

  async update(id: number, dto: UpdateChainDto) {
    await this.findOne(id);

    try {
      return await this.prisma.chain.update({
        where: { id },
        data: dto,
      });
    } catch (err) {
      throw err;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.chain.delete({
      where: { id },
    });
  }
}
