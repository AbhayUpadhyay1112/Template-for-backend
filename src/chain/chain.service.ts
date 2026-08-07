import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChainDto } from './dto/create-chain.dto';
import { UpdateChainDto } from './dto/update-chain.dto';
import { ChainResponseDto } from './dto/chain-response.dto';

@Injectable()
export class ChainService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChainDto, userId: number) {
    if (dto.fallbackRpc && dto.rpc === dto.fallbackRpc) {
      throw new BadRequestException(
        'Fallback RPC URL must be different from the Primary RPC URL.',
      );
    }

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
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Chain ID already exists. Please enter a unique Chain ID.',
        );
      }
      throw err;
    }
  }

  private toResponse(chain: any): ChainResponseDto {
    return {
      id: chain.id,
      chainId: chain.chainId,
      chainName: chain.chainName,
      rpc: chain.rpc,
      fallbackRpc: chain.fallbackRpc,
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
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Chain ID already exists. Please enter a unique Chain ID.',
        );
      }
      throw err;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      const deleted = await this.prisma.chain.delete({
        where: { id },
      });

      return this.toResponse(deleted);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'This chain cannot be deleted because it has dependent assets. Remove the dependencies first and try again.',
        );
      }
      throw error;
    }
  }
}
