import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService, MediaService],
  exports: [StorageService, MediaService],
})
export class MediaModule {}
