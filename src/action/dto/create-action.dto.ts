import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ActionCall, ActionType } from 'src/generated/prisma/enums';

export class CreateActionDto {
  @ApiProperty({ example: 'Balance Check' })
  @IsString()
  @IsNotEmpty()
  actionName: string;

  @ApiProperty({ example: 'Read Balance of Native Coin' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'Optional remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  chainID?: number;

  @ApiPropertyOptional({ example: 'Read' })
  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @ApiPropertyOptional({ example: 'EOA' })
  @IsEnum(ActionCall)
  callType?: ActionCall;

  @ApiPropertyOptional()
  @IsOptional()
  callMetaData?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  auto?: boolean;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Chain status e.g. active, inactive',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
