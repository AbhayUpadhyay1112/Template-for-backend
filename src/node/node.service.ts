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

  async nodeHealth(network: string): Promise<any> {
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
      const results = await Promise.all(
        _nodes.map(async (_node) => {
          const blockHeight = await this.getEVMBlockNumber(_node.id);
          return { name: _node.name, healthy: true, blockHeight };
        })
      );

      console.log('network 2');

      // Now compute maxHeight from the fully resolved results
      const maxHeight = Math.max(...results.map(r => r.blockHeight));

      const nodeObjects = results.map((_node) => ({
        ..._node,
        healthy: _node.blockHeight >= maxHeight - 5,
      }));

      console.log('network 3');

      return { nodes: nodeObjects, maxHeight };
    } else {
      throw new Error(`NotFoundException: No active nodes found for network ${network}`);
    }
  }
}