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

import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

import {
  AccessGuard,
  AuthenticatedRequest,
  DisableCache,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';

@ApiTags('Asset')
@ApiBearerAuth()
@Roles(UserType.Admin)
@Controller('asset')
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
@DisableCache()
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({
    status: 201,
    description: 'Asset created',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateAssetDto) {
    return this.assetService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  @ApiResponse({
    status: 200,
    description: 'Assets fetched successfully',
  })
  findAll() {
    return this.assetService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an asset by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Asset fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assetService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an asset' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Asset updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Asset deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assetService.remove(id);
  }
}
