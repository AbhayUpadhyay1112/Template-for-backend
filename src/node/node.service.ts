import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import {firstValueFrom} from 'rxjs';
import { Axios } from 'axios';

@Injectable()
export class NodesService {
  constructor(private prisma: PrismaService, private readonly httpService: HttpService) {}

  async create(dto: CreateNodeDto) {
    try {
      return await this.prisma.node.create({ data: dto });
    } catch (err) {
        throw err;
    }
  }

  findAll() {
    return this.prisma.node.findMany({ orderBy: { createdAt: 'desc' } });
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
    if(node){
     const rpcUrl = node.url;
     console.log('rpcUrl', rpcUrl);
      const response =  await firstValueFrom(this.httpService.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id:1,
      }));

    console.log('response', response); 

    const hexBlockNumber = response?.data?.result; // e.g. "0x112a880"
    console.log('hexBlockNumber', hexBlockNumber);
    return parseInt(hexBlockNumber, 16); // decimal, e.g. 18012288
  }
  else{
    throw new NotFoundException(`Node with id ${id} not found`);
  }
}

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.node.delete({ where: { id } });
  }
}