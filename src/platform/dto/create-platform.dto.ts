import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';

export class CreatePlatformDto {
  @ApiProperty({ example: 'MST' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'mst' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Platform status e.g. active, inactive',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty()
  @IsNumber()
  createdBy: number;
}
