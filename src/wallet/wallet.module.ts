import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { KMSEVMSignerModule } from 'src/kms-evm-signer';

@Module({
  imports: [PrismaModule, KMSEVMSignerModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
