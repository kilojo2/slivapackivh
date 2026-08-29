import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { StorageService } from './storage.service';
import {
  detectMediaType,
  isImage,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_PIXELS,
  MAX_VIDEO_BYTES,
} from './media.util';

export interface ProcessedMedia {
  key: string;
  contentType: string;
  width?: number;
  height?: number;
}

@Injectable()
export class MediaService {
  constructor(private readonly storage: StorageService) {}

  async processImage(buffer: Buffer): Promise<ProcessedMedia> {
    const type = detectMediaType(buffer);
    if (!isImage(type)) {
      throw new BadRequestException('Недопустимый формат изображения');
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Изображение слишком большое');
    }

    const inputMeta = await sharp(buffer).metadata();
    const pixels = (inputMeta.width ?? 0) * (inputMeta.height ?? 0);
    if (pixels > MAX_IMAGE_PIXELS) {
      throw new BadRequestException('Слишком высокое разрешение изображения');
    }

    // Перекодирование в WebP без withMetadata() удаляет EXIF/GPS-метаданные.
    // rotate() сначала применяет EXIF-ориентацию, чтобы фото не перевернулось.
    const processed = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const meta = await sharp(processed).metadata();
    const key = `cards/${randomUUID()}.webp`;

    await this.storage.upload(key, processed, 'image/webp');

    return {
      key,
      contentType: 'image/webp',
      width: meta.width,
      height: meta.height,
    };
  }

  async processVideo(buffer: Buffer): Promise<ProcessedMedia> {
    const type = detectMediaType(buffer);
    if (type !== 'video/mp4') {
      throw new BadRequestException('Недопустимый формат видео');
    }
    if (buffer.length > MAX_VIDEO_BYTES) {
      throw new BadRequestException('Видео слишком большое');
    }

    const key = `cards/${randomUUID()}.mp4`;
    await this.storage.upload(key, buffer, 'video/mp4');

    return { key, contentType: 'video/mp4' };
  }
}
