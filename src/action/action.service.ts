import { Injectable } from '@nestjs/common';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { PrismaService } from '../prisma';

@Injectable()
export class ActionService {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: CreateActionDto) {
    if (!data?.chainID) {
      return { status: false, message: 'chainID is required' };
    }
    return await this.prisma.action.create({
      data: {
        actionName: data.actionName,
        description: data.description,
        remarks: data.remarks,
        chainID: data.chainID,
        actionType: data.actionType,
        auto: data.auto,
        status: data.status,
        callMetaData: data.callMetaData,
        callType: data.callType,
      },
    });
  }

  async call(actionId: number) {
    const action = await this.prisma.action.findUniqueOrThrow({
      include: {
        chain: true,
      },
      where: { id: actionId },
    });

    // if (action.callType === 'EOA') {
    //   if (action.actionType === 'Read') {
    //     // TODO: Need to handle the EVM & Tron RPC calls based on the chain type
    //     const provider = new ethers.JsonRpcProvider(
    //       action.wallet.asset.chain.rpc ||
    //         action.wallet.asset.chain.fallbackRpc ||
    //         'http://localhost:8545',
    //     );

    //     if (action.wallet.asset.address === ethers.ZeroAddress) {
    //       const balance = await provider.getBalance(
    //         action.wallet.walletAddress,
    //       );
    //       return ethers.formatEther(balance);
    //     } else {
    //       const contract = new ethers.Contract(
    //         action.wallet.asset.address || ethers.ZeroAddress,
    //         [
    //           'function balanceOf(address owner) view returns (uint256)',
    //           'function decimals() view returns (uint8)',
    //         ],
    //         provider,
    //       );
    //       const balance = await contract.balanceOf(action.wallet.walletAddress);
    //       const decimals = await contract.decimals();
    //       return ethers.formatUnits(balance, decimals);
    //     }
    //   } else if (action.actionType === 'Write') {
    //     throw new Error(`Write call not implemented yet`);
    //   } else {
    //     throw new Error(`Unsupported action type: ${action.actionType}`);
    //   }
    // } else if (action.callType === 'SC') {
    //   throw new Error(`Smart contract call not implemented yet`);
    // } else {
    //   throw new Error(`Unsupported call type: ${action.callType}`);
    // }
  }

  async findAll() {
    const actions = await this.prisma.action.findMany({
      include: {
        chain: true,
      },
    });

    return actions;
  }

  async findOne(id: number) {
    const action = await this.prisma.action.findUnique({
      where: { id },
      include: {
        chain: true,
      },
    });

    return action;
  }

  async update(id: number, data: UpdateActionDto) {
    return await this.prisma.action.update({
      data: {
        actionName: data.actionName,
        description: data.description,
        remarks: data.remarks,
        actionType: data.actionType,
        auto: data.auto,
        status: data.status,
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
