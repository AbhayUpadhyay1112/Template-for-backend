import { Module } from '@nestjs/common';
import { ChainService } from './chain.service';
import { ChainController } from './chain.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChainController],
  providers: [ChainService],
})
export class ChainModule {}
