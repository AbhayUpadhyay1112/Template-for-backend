import { Module } from '@nestjs/common';
import { WatcherService } from './watcher.service';
import { WatcherController } from './watcher.controller';
import { PrismaModule } from '../prisma';
import { NodeModule } from '../node/node.module';
import { NodeHealthMonitorService } from './node-health-monitor.service';

@Module({
  imports: [PrismaModule, NodeModule],
  controllers: [WatcherController],
  providers: [WatcherService, NodeHealthMonitorService],
})
export class WatcherModule {}
