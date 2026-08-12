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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ActionService } from './action.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import {
  AccessGuard,
  DisableCache,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';

@ApiTags('Action')
@ApiBearerAuth()
@Roles(UserType.Admin)
@Controller('action')
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
@DisableCache()
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new action' })
  @ApiResponse({ status: 201, description: 'Action created successfully' })
  create(@Body() createActionDto: CreateActionDto) {
    return this.actionService.create(createActionDto);
  }

  @Post(':id/call')
  @ApiOperation({ summary: 'Call an action by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Action called successfully' })
  call(@Param('id', ParseIntPipe) id: number) {
    return this.actionService.call(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all actions' })
  @ApiResponse({ status: 200, description: 'Return all actions' })
  findAll() {
    return this.actionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an action by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Return action by ID' })
  @ApiResponse({ status: 404, description: 'Action not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.actionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an action by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Action updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateActionDto) {
    return this.actionService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an action by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Action deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.actionService.remove(id);
  }
}
