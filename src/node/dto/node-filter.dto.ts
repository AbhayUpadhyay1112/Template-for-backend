import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class NodeFilterDto {
  @ApiPropertyOptional({
    example: 0,
    required: false,
    description: 'Number of items to skip ',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    example: 10,
    required: false,
    description: 'Number of items to take (pagination only applies when this or skip is provided)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @ApiPropertyOptional({
    example: 'MST',
    required: false,
    description: 'Filter nodes by network name',
  })
  @IsOptional()
  @IsString()
  network?: string;
}
