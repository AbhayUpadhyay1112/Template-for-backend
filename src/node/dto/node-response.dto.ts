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

  @ApiPropertyOptional()
  thumbnailImage?: string | null;

  @ApiPropertyOptional()
  minerAddress?: string | null;

  @ApiPropertyOptional()
  contractAddress?: string | null;

  @ApiPropertyOptional()
  operatorAddress?: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  tag: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  healthy: boolean;

  @ApiProperty()
  hasPeers: boolean;

  @ApiProperty()
  listening: boolean;

  @ApiProperty()
  syncing: boolean;

  @ApiProperty()
  startingBlock: number;

  @ApiProperty()
  currentBlock: number;

  @ApiProperty()
  highestBlock: number;

  @ApiProperty()
  peerCount: number;

  @ApiPropertyOptional()
  blockHeight?: number;

  @ApiPropertyOptional()
  validatorCreatedTime?: string;

  @ApiPropertyOptional()
  jailStatus?: boolean;

  @ApiPropertyOptional()
  jailUntil?: string;

  @ApiProperty()
  isActiveValidator: boolean;
}
