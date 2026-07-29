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
    example: 1,
    description: 'Platform ID associated with the wallet',
  })
  @IsNumber()
  @IsNotEmpty()
  platformId: number;

  @ApiProperty({
    enum: WalletPurpose,
    description: 'Purpose of the wallet',
  })
  @IsEnum(WalletPurpose)
  purpose: WalletPurpose;

  @ApiProperty({
    example: 1,
    description: 'Asset ID associated with the wallet',
  })
  @IsNumber()
  assetId: number;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Current status of the wallet',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
