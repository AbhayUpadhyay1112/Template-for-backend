import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { PrismaService } from '../prisma';

@Injectable()
export class ActionService {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: CreateActionDto) {
    return await this.prisma.action.create({
      data: {
        actionName: data.actionName,
        description: data.description,
        actionType: data.actionType,
        auto: data.auto,
        status: data.status,
        walletId: data.walletId,
        callMetaData: data.callMetaData,
        callType: data.callType,
      },
    });
  }

  async call(actionId: number) {
    const action = await this.prisma.action.findUniqueOrThrow({
      include: {
        wallet: {
          include: {
            platform: true,
            asset: {
              include: {
                chain: true,
              },
            },
          },
        },
      },
      where: { id: actionId },
    });

    if (action.callType === 'EOA') {
      if (action.actionType === 'Read') {
        // TODO: Need to handle the EVM & Tron RPC calls based on the chain type
        const provider = new ethers.JsonRpcProvider(
          action.wallet.asset.chain.rpc ||
            action.wallet.asset.chain.fallbackRpc ||
            'http://localhost:8545',
        );

        if (action.wallet.asset.address === ethers.ZeroAddress) {
          const balance = await provider.getBalance(
            action.wallet.walletAddress,
          );
          return ethers.formatEther(balance);
        } else {
          const contract = new ethers.Contract(
            action.wallet.asset.address || ethers.ZeroAddress,
            [
              'function balanceOf(address owner) view returns (uint256)',
              'function decimals() view returns (uint8)',
            ],
            provider,
          );
          const balance = await contract.balanceOf(action.wallet.walletAddress);
          const decimals = await contract.decimals();
          return ethers.formatUnits(balance, decimals);
        }
      } else if (action.actionType === 'Write') {
        throw new Error(`Write call not implemented yet`);
      } else {
        throw new Error(`Unsupported action type: ${action.actionType}`);
      }
    } else if (action.callType === 'SC') {
      throw new Error(`Smart contract call not implemented yet`);
    } else {
      throw new Error(`Unsupported call type: ${action.callType}`);
    }
  }
  async findAll(walletId: number) {
    return await this.prisma.action.findMany({
      include: {
        wallet: {
          include: {
            platform: true,
            asset: {
              include: {
                chain: true,
              },
            },
          },
        },
      },
      where: {
        walletId,
      },
      orderBy: { id: 'asc' },
    });
  }
  async update(id: number, data: UpdateActionDto) {
    return await this.prisma.action.update({
      data: {
        actionName: data.actionName,
        description: data.description,
        actionType: data.actionType,
        auto: data.auto,
        status: data.status,
        walletId: data.walletId,
        callMetaData: data.callMetaData,
        callType: data.callType,
      },
      where: {
        id,
      },
    });
  }

  async remove(id: number) {
    return await this.prisma.action.delete({
      where: { id },
    });
  }
}
