import { PartialType } from '@nestjs/swagger';
import { CreateWatcherDto } from './create-watcher.dto';

export class UpdateWatcherDto extends PartialType(CreateWatcherDto) {}
