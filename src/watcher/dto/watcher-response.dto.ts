import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WatcherType } from 'src/generated/prisma/enums';

export class WatcherResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: WatcherType })
  type: WatcherType;

  @ApiProperty()
  frequency: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  walletId: number;

  @ApiProperty()
  actionId: number;

  @ApiPropertyOptional()
  lastRunAt?: Date | null;

  @ApiPropertyOptional()
  createdBy?: number | null;

  @ApiPropertyOptional()
  updatedBy?: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
