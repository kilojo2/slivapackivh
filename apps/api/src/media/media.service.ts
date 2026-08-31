import { BadRequestException, Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { open } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { StorageService } from './storage.service';
import {
  detectMediaType,
  isImage,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_PIXELS,
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

  async processVideo(
    source: { buffer: Buffer } | { path: string; size: number },
    maxBytes: number,
  ): Promise<ProcessedMedia> {
    const head = Buffer.alloc(12);
    let size: number;

    if ('buffer' in source) {
      source.buffer.copy(head, 0, 0, 12);
      size = source.buffer.length;
    } else {
      size = source.size;
      const fh = await open(source.path, 'r');
      try {
        await fh.read(head, 0, 12, 0);
      } finally {
        await fh.close();
      }
    }

    if (detectMediaType(head) !== 'video/mp4') {
      throw new BadRequestException('Недопустимый формат видео');
    }
    if (size > maxBytes) {
      throw new BadRequestException(
        `Видео слишком большое (максимум ${Math.round(maxBytes / 1024 / 1024)} МБ)`,
      );
    }

    const key = `cards/${randomUUID()}.mp4`;
    if ('buffer' in source) {
      await this.storage.upload(key, source.buffer, 'video/mp4');
    } else {
      await this.storage.uploadStream(
        key,
        createReadStream(source.path),
        'video/mp4',
        size,
      );
    }

    return { key, contentType: 'video/mp4' };
  }
}
