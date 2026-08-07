import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsEthereumAddress,
  Matches,
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
    example: '9f4b7d5e-a123-4f56-9876-abcdef123456',
    description: 'AWS KMS Key ID (UUID format)',
  })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message:
      'awsKeyID must be in UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
  })
  awsKeyID?: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Current status of the wallet',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
