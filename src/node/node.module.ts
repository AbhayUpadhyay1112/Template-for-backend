import { Module } from '@nestjs/common';
import { NodesController } from './node.controller';
import { NodesService } from './node.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { KMSEVMSignerModule } from '../kms-evm-signer';

@Module({
  imports: [PrismaModule, HttpModule, KMSEVMSignerModule],
  controllers: [NodesController],
  providers: [NodesService],
  exports: [NodesService, HttpModule],
})
export class NodeModule {}
