import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { firstValueFrom } from 'rxjs';
import { Axios } from 'axios';
import { NodeFilterDto } from './dto/node-filter.dto';

@Injectable()
export class NodesService {
  constructor(private prisma: PrismaService, private readonly httpService: HttpService) { }

  async create(dto: CreateNodeDto) {
    try {
      return await this.prisma.node.create({ data: dto });
    } catch (err) {
      throw err;
    }
  }

  async findAll(filter: NodeFilterDto) {
    const where: any = {};

    if (filter.network) {
      where.network = filter.network;
    }

    const count = await this.prisma.node.count({ where });

    const isPaginated = filter.skip != null || filter.take != null;

    if (!isPaginated) {

      const data = await this.prisma.node.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return { count, data };
    }

    const skip = filter.skip ?? 0;
    const take = filter.take ?? 10;

    const data = await this.prisma.node.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return {
      count,
      skip,
      take,
      data,
    };
  }
  async findOne(id: number) {
    const node = await this.prisma.node.findUnique({ where: { id } });
    if (!node) throw new NotFoundException(`Node with id ${id} not found`);
    return node;
  }

  async update(id: number, dto: UpdateNodeDto) {
    await this.findOne(id);
    try {
      return await this.prisma.node.update({ where: { id }, data: dto });
    } catch (err) {
      throw err;
    }
  }

  async getEVMBlockNumber(id: number): Promise<number> {
    const node = await this.findOne(id);
    if (node) {
      const rpcUrl = node.url;
      console.log('rpcUrl', rpcUrl);
      try {
        const response = await firstValueFrom(this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }));

        const hexBlockNumber = response?.data?.result; // e.g. "0x112a880"
        return parseInt(hexBlockNumber, 16); // decimal, e.g. 18012288
      }
      catch (err: any) {
        //console.error(`Error fetching block number for node ${id}:`, err.message);
        throw new NotFoundException(`RPC Url ${id} is not responding as expected`);
        console.log('RPC ERROR:', err.message);
       console.log('RPC URL:', rpcUrl);
       console.log('ERROR CODE:', err.code);
      }

    }
    else {
      throw new NotFoundException(`Node with id ${id} not found`);
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.node.delete({ where: { id } });
  }

  async nodeHealthDetailed(rpcUrl: string): Promise<any> {
    const batch = [
        { jsonrpc: '2.0', method: 'net_listening', params: [], id: 1 },
        { jsonrpc: '2.0', method: 'net_peerCount', params: [], id: 2 },
        { jsonrpc: '2.0', method: 'eth_syncing', params: [], id: 3 },
        { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 4 },
    ];

    const { data } = await firstValueFrom(this.httpService.post(rpcUrl, batch, {
                         headers: { 'Content-Type': 'application/json' },
                      })
                    );

    // match by id — don't assume response order matches request order
    const byId = Object.fromEntries(data.map((r:any) => [r?.id, r]));

    const listening = byId[1].result;
    const peerCount = parseInt(byId[2].result, 16);
    const syncingRaw = byId[3].result;
    const blockNumber = parseInt(byId[4].result || 0,16);
    const sync = syncingRaw === false
    ? { syncing: false }
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
    blockNumber
    }
  }
  async nodeHealth(network: string): Promise<any> {
    let nodeObjects:any = [];
    const _nodes = await this.prisma.node.findMany({
      where: {
        network: {
          equals: network,
          mode: 'insensitive',
        },
        status: 'active',
      },
    });
    console.log('_nodes', _nodes);
    if (_nodes.length) {
      console.log('network', network);

      // Run all block-height fetches in parallel and wait for them all to finish
      await Promise.all(
        _nodes.map(async (_node) => {
          const healthDetails = await this.nodeHealthDetailed(_node.url);
          console.log(healthDetails,JSON.stringify(healthDetails));
          nodeObjects.push({ 
                          name: _node.name, 
                          healthy: healthDetails.healthy, 
                          hasPeers: healthDetails.hasPeers, 
                          listening: healthDetails.listening, 
                          syncing: healthDetails.syncing, 
                          peerCount: healthDetails.peerCount, 
                          blockHeight: healthDetails.blockNumber });
        })
      );

      return { nodes: nodeObjects };
    } else {
      throw new Error(`NotFoundException: No active nodes found for network ${network}`);
    }
  }
}