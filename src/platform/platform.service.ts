import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(slug: string): string {
    return slug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async create(dto: CreatePlatformDto, userId: number) {
    try {
      return await this.prisma.platform.create({
        data: {
          name: dto.name,
          slug: this.generateSlug(dto.slug),
          status: dto.status,
          createdBy: userId,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async findAll() {
    const data = await this.prisma.platform.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return { count: data.length, data };
  }

  async findOne(id: number) {
    const platform = await this.prisma.platform.findUnique({
      where: { id },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with id ${id} not found`);
    }

    return platform;
  }

  async update(id: number, dto: UpdatePlatformDto, userId: number) {
    await this.findOne(id);

    try {
      return await this.prisma.platform.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.slug && {
            slug: this.generateSlug(dto.slug),
          }),
          updatedBy: userId,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      return await this.prisma.platform.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'This platform cannot be deleted because it has dependent wallets. Remove the dependencies first and try again.',
        );
      }
      throw error;
    }
  }
}
