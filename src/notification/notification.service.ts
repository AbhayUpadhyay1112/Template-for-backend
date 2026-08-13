import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

import { NotificationFilterDto } from './dto/notification-filter.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter?: NotificationFilterDto) {
    const count = await this.prisma.notification.count();

    const isPaginated = filter?.skip != null || filter?.take != null;

    if (!isPaginated) {
      const data = await this.prisma.notification.findMany({
        include: {
          watcher: true,
          node: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        count,
        data,
      };
    }

    const skip = filter.skip ?? 0;
    const take = filter.take ?? 10;

    const data = await this.prisma.notification.findMany({
      skip,
      take,
      include: {
        watcher: true,
        node: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      count,
      skip,
      take,
      data,
    };
  }

  async findOne(id: number) {
    return await this.prisma.notification.findUniqueOrThrow({
      where: { id },
      include: {
        watcher: true,
        node: true,
      },
    });
  }

  async readNotification(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
      },
      include: {
        watcher: true,
      },
    });
  }
}
