import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWatcherDto } from './dto/create-watcher.dto';
import { UpdateWatcherDto } from './dto/update-watcher.dto';
import { UtilsService } from '@Common';
import { CallMetaData } from '../wallet/wallet.service';
import dayjs from 'dayjs';

const WATCHER_SELECT = {
  id: true,
  name: true,
  description: true,
  type: true,
  threshold: true,
  frequency: true,
  walletId: true,
  actionId: true,
  lastRunAt: true,
  nextRunAt: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class WatcherService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
  ) {}

  onApplicationBootstrap() {
    this.runWatchers();
  }

  async runWatchers() {
    try {
      // TODO: Optimization needed
      const watchers = await this.prisma.watcher.findMany({
        where: {
          status: 'active',
          OR: [
            { nextRunAt: { equals: null } },
            { nextRunAt: { lte: new Date() } },
          ],
        },
        include: {
          action: {
            include: {
              chain: true,
            },
          },
          wallet: true,
        },
      });

      await this.utilsService.batchable(watchers, async (watcher) => {
        try {
          if (watcher.type !== 'minUintThreshold') {
            throw new Error('Only minUintThreshold watchers are supported');
          }

          const action = watcher.action;
          // const wallet = watcher.wallet;
          const chain = watcher.action.chain;

          if (action.actionType !== 'Read' || action.callType !== 'SC') {
            throw new Error(
              'Only read watchers are allowed with call type smart contract',
            );
          }

          let callMetaData = action.callMetaData as CallMetaData;

          //check if CallMetaData is String or JSON, if String Parse JSON
          if (
            callMetaData == null &&
            this.utilsService.isJSONString(callMetaData as unknown as string)
          ) {
            throw new Error(
              `Action was Created with wrong Call Meta data was not as per standard`,
            );
          }
          if (typeof callMetaData == 'string') {
            callMetaData = JSON.parse(callMetaData);
          }
          if (!callMetaData.contractAddress) {
            throw new Error(
              `Action was Created with wrong Call Meta data, Contract Address Not found`,
            );
          }
          if (!callMetaData.abi) {
            throw new Error(
              `Action was Created with wrong Call Meta data, Contract Address Not found`,
            );
          }

          // Exec
          const { rpc } = chain;
          const provider = new ethers.JsonRpcProvider(rpc);

          const contractObject = new ethers.Contract(
            callMetaData.contractAddress,
            [callMetaData.abi],
            provider,
          );
          const callData = contractObject.interface.encodeFunctionData(
            callMetaData.abi.name as string,
            (watcher.callParams as any) || [],
          );
          const data = await provider.call({
            to: callMetaData.contractAddress,
            data: callData,
          });
          const response = contractObject.interface.decodeFunctionResult(
            callMetaData.abi.name as string,
            data,
          );

          console.log(response);

          const outcome = response[0];

          let notification: any = null;
          let notificationType: any = null;
          let resetWatcherNotification: boolean = false;

          const notifyWindowEnabled =
            !watcher.notifiedAt ||
            dayjs().subtract(1, 'hour').isAfter(watcher.notifiedAt);

          if (
            BigInt(watcher.threshold?.toString() || '0') >= BigInt(outcome) &&
            notifyWindowEnabled
          ) {
            notificationType = 'Error';
            notification = {
              type: 'Error',
              title: `${watcher.name} - Threshold Breach`,
              message: `Value is below the threshold. Current value: ${outcome}, Threshold: ${watcher.threshold}`,
              watcherId: watcher.id,
            };
          } else if (
            watcher.notificationType === 'Error' &&
            BigInt(watcher.threshold?.toString() || '0') < BigInt(outcome)
          ) {
            notificationType = 'Info';
            resetWatcherNotification = true;
            notification = {
              type: 'Info',
              title: `${watcher.name} - Threshold Resolved`,
              message: `Value is above the threshold. Current value: ${outcome}, Threshold: ${watcher.threshold}`,
              watcherId: watcher.id,
            };
          }

          // Reschedule
          let nextRunAt = dayjs(watcher.nextRunAt || new Date()).add(
            watcher.frequency,
            'seconds',
          );
          while (!nextRunAt.isAfter(new Date())) {
            nextRunAt = dayjs(nextRunAt).add(watcher.frequency, 'seconds');
          }

          await this.prisma.$transaction(async (tx) => {
            await tx.watcher.update({
              data: {
                lastRunAt: watcher.nextRunAt,
                nextRunAt: nextRunAt.toDate(),
                notificationType: notificationType ?? undefined,
                ...(resetWatcherNotification && {
                  notificationType: null,
                  notifiedAt: null,
                }),
                ...(!resetWatcherNotification &&
                  notification && { notifiedAt: new Date() }),
              },
              where: {
                id: watcher.id,
              },
            });

            if (notification) {
              await tx.notification.create({
                data: notification,
              });
            }
          });
        } catch (err) {
          console.error(err);
        }
      });
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => this.runWatchers(), 5000);
  }

  async create(dto: CreateWatcherDto, userId: number) {
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

    try {
      return await this.prisma.watcher.create({
        data: {
          name: dto.name,
          description: dto.description,
          type: dto.type,
          threshold: dto.threshold,
          frequency: dto.frequency,
          walletId: dto.walletId,
          actionId: dto.actionId,
          createdBy: userId,
        },
        select: WATCHER_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException('Invalid walletId or actionId');
      }
      throw error;
    }
  }

  async findAll() {
    const [count, data] = await this.prisma.$transaction([
      this.prisma.watcher.count(),
      this.prisma.watcher.findMany({
        orderBy: { createdAt: 'desc' },
        select: WATCHER_SELECT,
      }),
    ]);

    return { count, data };
  }

  async findOne(id: number) {
    const watcher = await this.prisma.watcher.findUnique({
      where: { id },
      select: WATCHER_SELECT,
    });

    if (!watcher) {
      throw new NotFoundException(`Watcher with id ${id} not found`);
    }

    return watcher;
  }

  async update(id: number, dto: UpdateWatcherDto, userId: number) {
    await this.findOne(id);

    return this.prisma.watcher.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
      select: WATCHER_SELECT,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.watcher.delete({
      where: { id },
      select: WATCHER_SELECT,
    });
  }
}
