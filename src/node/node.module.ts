import { Module } from '@nestjs/common';
import { NodesController } from './node.controller';
import { NodesService } from './node.service';
import { PrismaModule } from '../prisma/prisma.module'; // adjust path if you don't have this
import { HttpModule } from '@nestjs/axios'; // Import HttpModule
import { KMSEVMSignerModule } from '../kms-evm-signer';

@Module({
  imports: [PrismaModule, HttpModule, KMSEVMSignerModule],
  controllers: [NodesController],
  providers: [NodesService],
})
export class NodeModule {}
