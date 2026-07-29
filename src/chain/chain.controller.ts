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

import { ChainService } from './chain.service';
import { CreateChainDto } from './dto/create-chain.dto';
import { UpdateChainDto } from './dto/update-chain.dto';

import {
  AccessGuard,
  AuthenticatedRequest,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';

@ApiTags('Chain')
@ApiBearerAuth()
@Roles(UserType.Admin)
@Controller('chain')
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
export class ChainController {
  constructor(private readonly chainService: ChainService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chain' })
  @ApiResponse({
    status: 201,
    description: 'Chain created',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateChainDto) {
    return this.chainService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chains' })
  @ApiResponse({
    status: 200,
    description: 'Chains fetched successfully',
  })
  findAll() {
    return this.chainService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chain by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Chain fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Chain not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chainService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chain' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Chain updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Chain not found',
  })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChainDto,
  ) {
    return this.chainService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chain' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Chain deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Chain not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chainService.remove(id);
  }
}
