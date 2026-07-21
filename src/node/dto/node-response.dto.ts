import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class NodeResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  network: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  thumbnailImage?: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}