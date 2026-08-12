import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsPositive,
  ValidateIf,
} from 'class-validator';
import { WatcherType } from 'src/generated/prisma/enums';

export class CreateWatcherDto {
  @ApiProperty({ example: 'Low Balance Watcher' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Watches wallet balance and triggers action when below threshold',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    enum: WatcherType,
    default: WatcherType.minUintThreshold,
    description: 'Type of watcher condition',
  })
  @IsOptional()
  @IsEnum(WatcherType)
  type: WatcherType;

  @ApiPropertyOptional({
    example: 100,
    description: 'Minimum uint value threshold',
  })
  @ValidateIf(
    (o: CreateWatcherDto) => o.type === WatcherType.minUintThreshold || !o.type,
  )
  @IsNotEmpty({
    message: 'threshold is required when type is minUintThreshold',
  })
  @IsNumber()
  @IsPositive()
  threshold?: number;

  @ApiPropertyOptional({
    example: 60,
    description: 'Polling frequency in seconds',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  frequency?: number;

  @ApiProperty({ example: 1, description: 'ID of the wallet to watch' })
  @IsInt()
  @IsPositive()
  walletId: number;

  @ApiProperty({ example: 1, description: 'ID of the action to trigger' })
  @IsInt()
  @IsPositive()
  actionId: number;
}
