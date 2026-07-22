import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  isEnum,
  IsNumber,
} from 'class-validator';
import { NodeTag } from 'src/generated/prisma/enums';

export class CreateNodeDto {
  @ApiProperty({
    example: 'rpc',
    description: 'Node type e.g. node, rpc, archive',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'MST' })
  @IsString()
  @IsNotEmpty()
  network: string;

  @ApiProperty({ example: 'Node 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://node1.example.com' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/thumb.png' })
  @IsOptional()
  @IsString()
  thumbnailImage?: string;

  @ApiProperty({ enum: NodeTag })
  @IsEnum(NodeTag)
  tag: NodeTag;

  @ApiProperty()
  @IsNumber()
  createdBy: number;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Node status e.g. active, inactive, maintenance',
  })
  @IsString()
  @IsNotEmpty()
  status?: string;
}
