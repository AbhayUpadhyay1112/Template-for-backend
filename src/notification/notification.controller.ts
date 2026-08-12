import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import {
  AccessGuard,
  DisableCache,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';

@ApiTags('Notifications')
@ApiBearerAuth()
@Roles(UserType.Admin)
@Controller('notification')
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
@DisableCache()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'Return all notifications' })
  findAll(@Query() filter: NotificationFilterDto) {
    return this.notificationService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Return notification by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.findOne(id);
  }
}
