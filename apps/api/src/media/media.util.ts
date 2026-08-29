export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 МБ
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 МБ
export const MAX_IMAGE_PIXELS = 40_000_000; // защита от decompression-bomb

export type MediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'video/mp4';

/**
 * Определение реального типа файла по magic bytes (а не по расширению).
 * Возвращает null, если формат не входит в белый список.
 */
export function detectMediaType(buffer: Buffer): MediaType | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // MP4: сигнатура 'ftyp' начиная с 4-го байта
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    return 'video/mp4';
  }

  return null;
}

export function isImage(type: MediaType | null): boolean {
  return type === 'image/jpeg' || type === 'image/png' || type === 'image/webp';
}
