import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUrl,
  IsNumber,
  ValidateIf,
} from 'class-validator';

export class CreateChainDto {
  @ApiProperty({
    example: 80002,
    description: 'Blockchain Chain ID',
  })
  @IsNumber()
  @IsNotEmpty()
  chainId: number;

  @ApiProperty({ example: 'MST' })
  @IsString()
  @IsNotEmpty()
  chainName: string;

  @ApiProperty({ example: 'https://rpc.example.com' })
  @IsUrl()
  @IsNotEmpty()
  rpc: string;

  @ApiPropertyOptional({ example: 'https://fallback-rpc.example.com' })
  @ValidateIf((o) => !!o.fallbackRpc)
  @IsOptional()
  @IsUrl()
  fallbackRpc?: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Chain status e.g. active, inactive',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
