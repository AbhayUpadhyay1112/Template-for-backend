import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ActionService } from './action.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';

@Controller('action')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Post()
  create(@Body() createActionDto: CreateActionDto) {
    return this.actionService.create(createActionDto);
  }
  @Post(':id/call')
  call(@Param('id', ParseIntPipe) id: number) {
    return this.actionService.call(id);
  }

  // @Get(':walletId')
  // findAll(@Param('walletId') walletId: number) {
  //   return this.actionService.findAll(walletId);
  // }

  @Get()
  findAll() {
    return this.actionService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateActionDto) {
    return this.actionService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.actionService.remove(+id);
  }
}
