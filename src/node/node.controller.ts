import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { NodesService } from './node.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { NodeResponseDto } from './dto/node-response.dto';
import {
  AccessGuard,
  AuthenticatedRequest,
  BaseController,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';


@ApiTags('Nodes')
@ApiBearerAuth()
@Roles(UserType.Admin)
@Controller('nodes')
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)

export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new node' })
  @ApiResponse({ status: 201, description: 'Node created', type: NodeResponseDto })
  @ApiResponse({ status: 409, description: 'Node with this URL already exists' })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNodeDto) {
    return this.nodesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all nodes' })
  @ApiResponse({ status: 200, type: [NodeResponseDto] })
  findAll() {
    return this.nodesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a node by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: NodeResponseDto })
  @ApiResponse({ status: 404, description: 'Node not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nodesService.findOne(id);
  }

  @Get('block-height/:id')
  @ApiOperation({ summary: 'Get block height of RPC by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Number })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async getBlockHeight(@Param('id', ParseIntPipe) id: number) {
    return this.nodesService.getEVMBlockNumber(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a node' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: NodeResponseDto })
  @ApiResponse({ status: 404, description: 'Node not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNodeDto) {
    return this.nodesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a node' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Node deleted' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.nodesService.remove(id);
  }
}