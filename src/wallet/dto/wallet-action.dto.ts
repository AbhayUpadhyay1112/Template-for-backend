import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsArray } from 'class-validator';

export class WalletActionDTO {
  @ApiProperty({
    example: 1,
    description: 'Action ID',
  })
  @IsNumber()
  @IsNotEmpty()
  actionId: number;

  @ApiProperty({
    example: 1,
    description: 'Wallet ID',
  })
  @IsNumber()
  @IsNotEmpty()
  walletId: number;

  @ApiProperty({
    example: ['param1', 'param2'],
    description: 'Data array parameters',
  })
  @IsArray()
  @IsNotEmpty()
  data: any[];
}
