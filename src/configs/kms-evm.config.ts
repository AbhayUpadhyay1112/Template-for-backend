import { registerAs } from '@nestjs/config';

export const kmsEvmConigFactory = registerAs('kmsevm', () => ({
  KEY_ID: process.env.AWS_KEY_ID || '',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  maxFeePerGas: BigInt(process.env.MST_MAX_FEE_PER_GAS || '1000000000000'),
  maxPriorityFeePerGas: BigInt(
    process.env.MST_PRIROITY_FEE_PAR_GAS || '1000000000',
  ),
  region: process.env.AWS_REGION || 'us-east-1',
}));
