/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { firstValueFrom } from 'rxjs';
import { Axios } from 'axios';
import { NodeFilterDto } from './dto/node-filter.dto';
import { NodeResponseDto } from './dto/node-response.dto';
import {
  DEFAULT_MST_RPC_URL,
  SLASH_INDICATOR_ABI,
  SLASH_INDICATOR_ADDRESS,
  STAKE_HUB_ABI,
  STAKE_HUB_ADDRESS,
  VALIDATOR_SET_ABI,
  VALIDATOR_SET_ADDRESS,
} from './mst.constants';
import { ethers } from 'ethers';
import { EntityType, NodeTag } from 'src/generated/prisma/enums';
import { UtilsService } from '@Common';
import { KMSEVMSigner } from '../kms-evm-signer/kms-evm-signer.service';

@Injectable()
export class NodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly utilsService: UtilsService,
    private readonly kmsEvmSigner: KMSEVMSigner,
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
          minerAddress: dto.minerAddress,
          contractAddress: dto.contractAddress,
          operatorAddress: dto.operatorAddress,
          status: dto.status,
          tag: dto.tag,
          createdBy: id,
        },
      });
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
          minerAddress: true,
          contractAddress: true,
          operatorAddress: true,
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
        minerAddress: true,
        operatorAddress: true,
        contractAddress: true,
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
        minerAddress: true,
        contractAddress: true,
        operatorAddress: true,
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

    const [response] = await this.mergeNodeHealth([node], true);

    return response;
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

  private getProvider(customRpc: string) {
    try {
      const provider = new ethers.JsonRpcProvider(customRpc);
      return provider;
    } catch (err) {}
  }

  private async getValidatorJAILStatus(
    network: string,
    rpcUrl: string,
    validatorAddress: string,
  ) {
    //Get the provider for the given RPC URL
    const provider = this.getProvider(rpcUrl);
    if (!provider) return null;
    //Create a contract instance for the StakeHub contract
    const stakeHub = new ethers.Contract(
      process.env[`${network.toUpperCase()}_STAKE_HUB_ADDRESS`] ||
        STAKE_HUB_ADDRESS,
      STAKE_HUB_ABI,
      provider,
    );
    let validatorInfo;
    await this.utilsService.timeout(async () => {
      validatorInfo = await stakeHub.getValidatorBasicInfo(validatorAddress);
    }, 5000);
    return validatorInfo;
  }

  private async getValidatorSlashIndicator(
    network: string,
    rpcUrl: string,
    validatorAddress: string,
  ) {
    const provider = this.getProvider(rpcUrl);
    if (!provider) return null;

    const slashIndicatorAddress =
      process.env[`${network.toUpperCase()}_SLASH_INDICATOR_ADDRESS`] ||
      SLASH_INDICATOR_ADDRESS;

    const slashIndicatorContract = new ethers.Contract(
      slashIndicatorAddress,
      SLASH_INDICATOR_ABI,
      provider,
    );

    let slashData: any = null;
    let misdemeanorThreshold: any = null;
    let felonyThreshold: any = null;

    await this.utilsService.timeout(async () => {
      try {
        slashData =
          await slashIndicatorContract.getSlashIndicator(validatorAddress);
      } catch (err) {}

      try {
        misdemeanorThreshold =
          await slashIndicatorContract.misdemeanorThreshold();
      } catch (err) {}

      try {
        felonyThreshold = await slashIndicatorContract.felonyThreshold();
      } catch (err) {}
    }, 5000);

    if (!slashData) return null;

    const lastBlockNumber =
      slashData[0] != null ? slashData[0].toString() : '0';
    const count = slashData[1] != null ? slashData[1].toString() : '0';
    const misThreshold =
      misdemeanorThreshold != null ? misdemeanorThreshold.toString() : null;
    const felThreshold =
      felonyThreshold != null ? felonyThreshold.toString() : null;

    const numCount = Number(count);
    const numMis = misThreshold != null ? Number(misThreshold) : null;
    const numFel = felThreshold != null ? Number(felThreshold) : null;

    return {
      lastBlockNumber,
      count,
      misdemeanorThreshold: misThreshold,
      felonyThreshold: felThreshold,
      isMisdemeanor:
        numMis !== null &&
        numCount >= numMis &&
        (numFel === null || numCount < numFel),
      isFelony: numFel !== null && numCount >= numFel,
    };
  }

  async getNodeSlashIndicator(id: number) {
    const node = await this.prisma.node.findUnique({
      where: { id },
    });

    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }

    const validatorAddr =
      node.operatorAddress || node.minerAddress || node.contractAddress;

    if (!validatorAddr) {
      return {
        id: node.id,
        name: node.name,
        slashIndicator: null,
        message: 'No validator/operator address provided for this node',
      };
    }

    const slashIndicatorStatus = await this.getValidatorSlashIndicator(
      node.network,
      node.url,
      validatorAddr,
    );

    return {
      id: node.id,
      name: node.name,
      network: node.network,
      validatorAddress: validatorAddr,
      slashIndicator: slashIndicatorStatus,
    };
  }

  async unjailNode(id: number): Promise<{ txHash: string }> {
    const node = await this.prisma.node.findUnique({
      where: { id },
    });

    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }

    const operatorAddress = node.operatorAddress;

    if (!operatorAddress) {
      throw new BadRequestException(
        `Node ${id} does not have an operatorAddress configured`,
      );
    }

    if (!ethers.isAddress(operatorAddress)) {
      throw new BadRequestException(
        `Invalid operatorAddress "${operatorAddress}" on Node ${id}`,
      );
    }

    const iface = new ethers.Interface(STAKE_HUB_ABI);
    const data = iface.encodeFunctionData('unjail', [operatorAddress]);

    const stakeHubAddress =
      process.env[`${node.network.toUpperCase()}_STAKE_HUB_ADDRESS`] ||
      STAKE_HUB_ADDRESS; // 0x0000000000000000000000000000000000002002

    const txHash = await this.kmsEvmSigner.sendRawTransaction({
      rpcUrl: node.url,
      to: stakeHubAddress,
      value: 0n,
      data,
    });

    return { txHash };
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

  async getAllMSTValidatorNode(): Promise<string[]> {
    const MSTRPC =
      process.env.MST_PUBLIC_RPC || 'https://mariorpc.mstblockchain.com';

    const provider = this.getProvider(MSTRPC);

    const stakeHub = new ethers.Contract(
      process.env.MST_VALIDATORS_SET ||
        '0x0000000000000000000000000000000000001000',
      VALIDATOR_SET_ABI,
      provider,
    );
    let validators: any = [];
    await this.utilsService.timeout(async () => {
      validators = await stakeHub.getValidators();
    }, 5000);
    return validators;
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
            const healthDetails = await this.nodeHealthDetailed(_node.url);

            if (healthDetails) {
              nodeObjects.push({
                name: _node.name,
                tag: _node.tag,
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
          } catch (err: any) {}
        }),
      );

      return {
        nodes: nodeObjects,
      };
    } else {
      throw new Error(
        `NotFoundException: No active nodes found for network ${network}`,
      );
    }
  }

  // Merge health details with each node
  private async mergeNodeHealth(nodes: any[], includeSlashIndicator = false) {
    const MSTALLValidators = (await this.getAllMSTValidatorNode()) ?? [];
    const data = await Promise.all(
      nodes.map(async (node, index) => {
        const { url, ...nodeData } = node;

        try {
          const healthDetails = await this.nodeHealthDetailed(url);

          let validatorStatus = null;
          let slashIndicatorStatus = null;
          let isActiveValidator = false;

          if (nodeData.tag == NodeTag.Validator) {
            const validatorAddr =
              nodeData.operatorAddress ||
              nodeData.minerAddress ||
              nodeData.contractAddress;

            if (validatorAddr) {
              validatorStatus = await this.getValidatorJAILStatus(
                nodeData.network,
                url,
                validatorAddr,
              );

              if (includeSlashIndicator) {
                slashIndicatorStatus = await this.getValidatorSlashIndicator(
                  nodeData.network,
                  url,
                  validatorAddr,
                );
              }
            }

            if (
              nodeData.minerAddress &&
              MSTALLValidators.some(
                (v) => v.toLowerCase() === nodeData.minerAddress.toLowerCase(),
              )
            ) {
              isActiveValidator = true;
            }
          }

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
            validatorCreatedTime: validatorStatus?.[0],
            jailStatus: validatorStatus?.[1],
            jailUntil: validatorStatus?.[2],
            isActiveValidator,
            ...(includeSlashIndicator && {
              slashIndicator: slashIndicatorStatus,
            }),
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
            validatorCreatedTime: null,
            jailStatus: null,
            jailUntil: null,
            isActiveValidator: false,
            ...(includeSlashIndicator && {
              slashIndicator: null,
            }),
          };
        }
      }),
    );
    return data;
  }
}
