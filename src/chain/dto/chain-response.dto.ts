import { ApiProperty } from '@nestjs/swagger';
export class ChainResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Unique chain identifier',
  })
  id: number;

  @ApiProperty({
    example: 80002,
    description: 'Blockchain Chain ID',
  })
  chainId: number;

  @ApiProperty({
    example: 'MST',
  })
  chainName: string;

  @ApiProperty({
    example: 'active',
    description: 'Chain status',
  })
  status: string;

  @ApiProperty({
    example: 1,
    description: 'User ID who created the chain',
  })
  createdBy: number;

  @ApiProperty({
    example: '2026-07-31T07:51:30.284Z',
  })
  createdAt: Date;

  @ApiProperty({
    example: 1,
    nullable: true,
  })
  updatedBy: number | null;

  @ApiProperty({
    example: '2026-07-31T07:51:30.284Z',
  })
  updatedAt: Date;
}
