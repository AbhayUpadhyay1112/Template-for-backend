/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { firstValueFrom } from 'rxjs';
import { Axios } from 'axios';
import { NodeFilterDto } from './dto/node-filter.dto';
import {
  DEFAULT_MST_RPC_URL,
  SLASH_INDICATOR_ABI,
  SLASH_INDICATOR_ADDRESS,
  STAKE_HUB_ABI,
  STAKE_HUB_ADDRESS,
  VALIDATOR_SET_ABI,
  VALIDATOR_SET_ADDRESS,
} from './mst.constants';

@Injectable()
export class NodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async create(dto: CreateNodeDto, id: number) {
    try {
      return await this.prisma.node.create({
        data: {
          name: dto.name,
          type: dto.type,
          network: dto.network,
          url: dto.url,
          thumbnailImage: dto.thumbnailImage,
          consensusAddress: dto.consensusAddress,
          validatorAddress: dto.validatorAddress,
          status: dto.status,
          tag: dto.tag,
          createdBy: id,
        },
      });
    } catch (err) {
      throw err;
    }
  }
  // Merge health details with each node
  private async mergeNodeHealth(nodes: any[]) {
    return Promise.all(
      nodes.map(async (node) => {
        const { url, ...nodeData } = node;

        try {
          const healthDetails = await this.nodeHealthDetailed(url);

          return {
            ...nodeData,
            healthy: healthDetails.healthy,
            hasPeers: healthDetails.hasPeers,
            listening: healthDetails.listening,
            syncing: healthDetails.syncing,
            startingBlock: healthDetails.syncing
              ? healthDetails.startingBlock
              : false,
            currentBlock: healthDetails.syncing
              ? healthDetails.currentBlock
              : false,
            highestBlock: healthDetails.syncing
              ? healthDetails.highestBlock
              : false,
            peerCount: healthDetails.peerCount,
            blockHeight: healthDetails.blockNumber,
          };
        } catch (err) {
          return {
            ...nodeData,
            healthy: false,
            hasPeers: false,
            listening: false,
            syncing: false,
            startingBlock: false,
            currentBlock: false,
            highestBlock: false,
            peerCount: 0,
            blockHeight: null,
          };
        }
      }),
    );
  }
  async findAll(filter: NodeFilterDto) {
    const where: any = {};

    if (filter.network) {
      where.network = filter.network;
    }

    const count = await this.prisma.node.count({ where });

    const isPaginated = filter.skip != null || filter.take != null;

    // Without pagination
    if (!isPaginated) {
      const nodes = await this.prisma.node.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          network: true,
          name: true,
          url: true, // mergeNodeHealth() ke liye
          thumbnailImage: true,
          consensusAddress: true,
          validatorAddress: true,
          status: true,
          tag: true,
        },
      });

      // Merge health data with nodes
      const data = await this.mergeNodeHealth(nodes);

      return {
        count,
        data,
      };
    }

    // With pagination
    const skip = filter.skip ?? 0;
    const take = filter.take ?? 10;

    const nodes = await this.prisma.node.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        network: true,
        name: true,
        url: true, // mergeNodeHealth() ke liye internally chahiye
        thumbnailImage: true,
        consensusAddress: true,
        validatorAddress: true,
        status: true,
        tag: true,
      },
    });

    // Merge health data with nodes
    const data = await this.mergeNodeHealth(nodes);

    return {
      count,
      skip,
      take,
      data,
    };
  }

  async findOne(id: number) {
    const node = await this.prisma.node.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        network: true,
        name: true,
        url: true,
        thumbnailImage: true,
        consensusAddress: true,
        validatorAddress: true,
        status: true,
        tag: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }

    const { url, ...nodeData } = node;

    try {
      const healthDetails = await this.nodeHealthDetailed(url);

      return {
        ...nodeData,
        healthy: healthDetails.healthy,
        hasPeers: healthDetails.hasPeers,
        listening: healthDetails.listening,
        syncing: healthDetails.syncing,
        startingBlock: healthDetails.syncing
          ? healthDetails.startingBlock
          : false,
        currentBlock: healthDetails.syncing
          ? healthDetails.currentBlock
          : false,
        highestBlock: healthDetails.syncing
          ? healthDetails.highestBlock
          : false,
        peerCount: healthDetails.peerCount,
        blockHeight: healthDetails.blockNumber,
      };
    } catch {
      return {
        ...nodeData,
        healthy: false,
        hasPeers: false,
        listening: false,
        syncing: false,
        startingBlock: false,
        currentBlock: false,
        highestBlock: false,
        peerCount: 0,
        blockHeight: null,
      };
    }
  }

  async update(id: number, dto: UpdateNodeDto) {
    const node = await this.prisma.node.findUnique({
      where: { id },
    });

    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }

    try {
      return await this.prisma.node.update({
        where: { id },
        data: dto,
      });
    } catch (err) {
      throw err;
    }
  }
  async getEVMBlockNumber(id: number): Promise<number> {
    const node = await this.prisma.node.findUnique({
      where: { id },
    });

    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }

    const rpcUrl = node.url;

    if (node) {
      const rpcUrl = node.url;

      try {
        const response = await firstValueFrom(
          this.httpService.post(rpcUrl, {
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
        );

        const hexBlockNumber = response?.data?.result;
        return parseInt(hexBlockNumber, 16);
      } catch (err: any) {
        throw new NotFoundException(
          `RPC Url ${id} is not responding as expected`,
        );
      }
    } else {
      throw new NotFoundException(`Node with id ${id} not found`);
    }
  }

  async remove(id: number) {
    const node = await this.prisma.node.findUnique({
      where: { id },
    });

    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }

    return await this.prisma.node.delete({
      where: { id },
    });
  }

  async nodeHealthDetailed(rpcUrl: string): Promise<any> {
    try {
      const batch = [
        {
          jsonrpc: '2.0',
          method: 'net_listening',
          params: [],
          id: 1,
        },
        {
          jsonrpc: '2.0',
          method: 'net_peerCount',
          params: [],
          id: 2,
        },
        {
          jsonrpc: '2.0',
          method: 'eth_syncing',
          params: [],
          id: 3,
        },
        {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 4,
        },
      ];

      const { data } = await firstValueFrom(
        this.httpService.post(rpcUrl, batch, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }),
      );

      // Match by id — don't assume response order matches request order
      const byId = Object.fromEntries(data.map((r: any) => [r?.id, r]));

      const listening = byId[1].result;

      const peerCount = parseInt(byId[2].result, 16);

      const syncingRaw = byId[3].result;

      const blockNumber = parseInt(byId[4].result || 0, 16);

      const sync =
        syncingRaw === false
          ? {
              syncing: false,
            }
          : {
              syncing: true,
              startingBlock: parseInt(syncingRaw.startingBlock, 16),
              currentBlock: parseInt(syncingRaw.currentBlock, 16),
              highestBlock: parseInt(syncingRaw.highestBlock, 16),
            };

      return {
        listening,
        peerCount,
        hasPeers: peerCount !== 0,
        ...sync,
        healthy: listening && peerCount !== 0 && !sync.syncing,
        blockNumber,
      };
    } catch (err) {
      throw new NotFoundException(
        `RPC Url ${rpcUrl} is not responding as expected `,
      );
    }
  }

  async nodeHealth(network: string): Promise<any> {
    const nodeObjects: any = [];

    const _nodes = await this.prisma.node.findMany({
      where: {
        network: {
          equals: network,
          mode: 'insensitive',
        },
        status: 'active',
      },
    });

    if (_nodes.length) {
      await Promise.allSettled(
        _nodes.map(async (_node) => {
          try {
            console.log('node', _node.name, _node.url);

            const healthDetails = await this.nodeHealthDetailed(_node.url);

            if (healthDetails) {
              nodeObjects.push({
                name: _node.name,
                healthy: healthDetails.healthy,
                hasPeers: healthDetails.hasPeers,
                listening: healthDetails.listening,
                syncing: healthDetails.syncing,
                startingBlock: healthDetails.syncing
                  ? healthDetails.startingBlock
                  : false,
                currentBlock: healthDetails.syncing
                  ? healthDetails.currentBlock
                  : false,
                highestBlock: healthDetails.syncing
                  ? healthDetails.highestBlock
                  : false,
                peerCount: healthDetails.peerCount,
                blockHeight: healthDetails.blockNumber,
              });
            }
          } catch (err: any) {
            console.error(
              `Error fetching health for node ${_node.name} (${_node.url}):`,
              err.message,
            );
          }
        }),
      );

      console.log(nodeObjects);

      return {
        nodes: nodeObjects,
      };
    } else {
      throw new Error(
        `NotFoundException: No active nodes found for network ${network}`,
      );
    }
  }
}
