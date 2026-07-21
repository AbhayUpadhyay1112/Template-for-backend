import { Module } from '@nestjs/common';
import { NodesController } from './node.controller';
import { NodesService } from './node.service';
import { PrismaModule } from '../prisma/prisma.module'; // adjust path if you don't have this
import { HttpModule } from '@nestjs/axios'; // Import HttpModule

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [NodesController],
  providers: [NodesService],
})
export class NodeModule {}