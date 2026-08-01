import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class NodeFilterDto {
  @ApiPropertyOptional({
    description: 'Number of items to skip ',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    description:
      'Number of items to take (pagination only applies when this or skip is provided)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @ApiPropertyOptional({
    description: 'Filter nodes by network name',
  })
  @IsOptional()
  @IsString()
  network?: string;
}
