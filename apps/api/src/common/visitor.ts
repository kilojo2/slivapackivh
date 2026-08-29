import { createHash } from 'node:crypto';

/**
 * Анонимный отпечаток посетителя (IP + User-Agent) для дедупликации лайков.
 * Хранится только хэш — персональные данные не сохраняются.
 */
export function hashVisitor(ip: string, userAgent: string): string {
  return createHash('sha256').update(`${ip}|${userAgent}`).digest('hex');
}
