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
import { WatcherService } from './watcher.service';
import { CreateWatcherDto } from './dto/create-watcher.dto';
import { UpdateWatcherDto } from './dto/update-watcher.dto';
import {
  AccessGuard,
  AuthenticatedRequest,
  DisableCache,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';

@ApiTags('Watchers')
@ApiBearerAuth()
@Roles(UserType.Admin)
@Controller('watchers')
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
@DisableCache()
export class WatcherController {
  constructor(private readonly watcherService: WatcherService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new watcher' })
  @ApiResponse({ status: 201, description: 'Watcher created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateWatcherDto) {
    return this.watcherService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all watchers' })
  @ApiResponse({ status: 200, description: 'List of all watchers with count' })
  findAll() {
    return this.watcherService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a watcher by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Watcher found' })
  @ApiResponse({ status: 404, description: 'Watcher not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.watcherService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a watcher' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Watcher updated successfully' })
  @ApiResponse({ status: 404, description: 'Watcher not found' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWatcherDto,
  ) {
    return this.watcherService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a watcher' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Watcher deleted successfully' })
  @ApiResponse({ status: 404, description: 'Watcher not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.watcherService.remove(id);
  }
}
