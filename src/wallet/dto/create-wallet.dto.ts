import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEthereumAddress,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

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

  @ApiPropertyOptional({
    example: '9f4b7d5e-a123-4f56-9876-abcdef123456',
    description: 'AWS KMS Key ID (UUID format)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value,
  )
  @ValidateIf((o, value) => Boolean(value))
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
