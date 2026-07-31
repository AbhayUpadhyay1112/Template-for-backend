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
    example: 'MST Gas Wallet',
    description: 'Name of the wallet',
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
