import { Module } from '@nestjs/common';
import { KMSEVMSigner } from './kms-evm-signer.service';
@Module({
  imports: [],
  controllers: [],
  providers: [KMSEVMSigner],
  exports: [KMSEVMSigner],
})
export class KMSEVMSignerModule {}
