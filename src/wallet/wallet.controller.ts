import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

import {
  AccessGuard,
  AuthenticatedRequest,
  DisableCache,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { WalletActionDTO } from './dto/wallet-action.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@Roles(UserType.Admin)
@Controller('wallet')
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
@DisableCache()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiResponse({
    status: 201,
    description: 'Wallet created',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateWalletDto) {
    return this.walletService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wallets' })
  @ApiResponse({
    status: 200,
    description: 'Wallets fetched successfully',
  })
  findAll() {
    return this.walletService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a wallet by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Wallet fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.walletService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a wallet' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Wallet updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWalletDto,
  ) {
    return this.walletService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a wallet' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Wallet deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.walletService.remove(id);
  }

  @Post('/action')
  @ApiOperation({ summary: 'Perform an Action' })
  @ApiResponse({
    status: 201,
    description: 'Action Performed',
  })
  action(@Req() req: AuthenticatedRequest, @Body() dto: WalletActionDTO) {
    return this.walletService.action(dto);
  }
}
