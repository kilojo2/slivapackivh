import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { safeEqual } from '../common/timing-safe';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 часов

@Injectable()
export class AdminAuthService {
  constructor(private readonly config: ConfigService) {}

  private secret(): string {
    return this.config.get<string>('ADMIN_TOKEN', '');
  }

  isConfigured(): boolean {
    return this.secret().length >= 16;
  }

  login(password: string): string {
    const secret = this.secret();
    if (!secret || !safeEqual(password, secret)) {
      throw new UnauthorizedException('Неверный пароль');
    }
    const exp = String(Date.now() + SESSION_TTL_MS);
    const sig = createHmac('sha256', secret).update(exp).digest('hex');
    return `${exp}.${sig}`;
  }

  verify(token: string | undefined): boolean {
    const secret = this.secret();
    if (!secret || !token) return false;
    const dot = token.lastIndexOf('.');
    if (dot <= 0) return false;
    const exp = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!/^\d+$/.test(exp)) return false;
    if (Date.now() > parseInt(exp, 10)) return false;
    const expected = createHmac('sha256', secret).update(exp).digest('hex');
    return safeEqual(sig, expected);
  }
}