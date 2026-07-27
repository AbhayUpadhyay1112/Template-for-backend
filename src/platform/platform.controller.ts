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

import { PlatformService } from './platform.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';

import {
  AccessGuard,
  AuthenticatedRequest,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';

@ApiTags('Platform')
@ApiBearerAuth()
@Roles(UserType.Admin)
@Controller('platform')
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new platform' })
  @ApiResponse({
    status: 201,
    description: 'Platform created',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePlatformDto) {
    return this.platformService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all platforms' })
  @ApiResponse({
    status: 200,
    description: 'Platforms fetched successfully',
  })
  findAll() {
    return this.platformService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a platform by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Platform fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Platform not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.platformService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a platform' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Platform updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Platform not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlatformDto,
  ) {
    return this.platformService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a platform' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Platform deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Platform not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.platformService.remove(id);
  }
}
