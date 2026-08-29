import { createHash, timingSafeEqual } from 'node:crypto';

/** Сравнение строк в постоянное время — защита от timing-атак на секрет webhook. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
