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

export class CreateWalletDto {
  @ApiProperty({
    example: 'Wallet address',
    description: 'Address of the wallet',
  })
  @IsEthereumAddress()
  walletAddress!: string;

  @ApiProperty({
    example: 'MST Gas Wallet',
    description: 'Name of the wallet',
  })
  @IsString()
  @IsNotEmpty()
  walletName: string;

  @ApiProperty({
    example: 'AWDDDUU-8688-EWWS-AAA',
    description: 'AWS KMS KEY ID',
  })
  @IsString()
  @IsOptional()
  awsKeyID: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Current status of the wallet',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
