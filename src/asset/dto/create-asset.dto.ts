import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ example: 'MST' })
  @IsString()
  @IsNotEmpty()
  assetName: string;

  @ApiProperty()
  @IsNumber()
  chainId: number;

  @ApiPropertyOptional({ example: '0x123456789...' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isNative: boolean;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Asset status e.g. active, inactive',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty()
  @IsNumber()
  createdBy: number;
}
