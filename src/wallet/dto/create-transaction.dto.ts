import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsEthereumAddress,
} from 'class-validator';
import { WalletPurpose } from 'src/generated/prisma/enums';

export class CreateTransactionDto {
  @ApiProperty({
    example: 'Wallet/Contract address',
    description: 'Address of the wallet/Contract',
  })
  @IsEthereumAddress()
  to: string;

  @ApiProperty({
    example: 1000000000000000000,
    description: 'Amount to send in wei (e.g. 1 MST = 1000000000000000000)',
  })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({
    example: 1,
    description: 'Chain ID associated with the wallet',
  })
  @IsNumber()
  @IsNotEmpty()
  chainId: number;

  @ApiProperty({
    description: 'CallData, if None leave blank',
  })
  @IsString()
  @IsOptional()
  data: string;
}
