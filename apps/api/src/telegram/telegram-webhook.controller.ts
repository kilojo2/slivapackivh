import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeEqual } from '../common/timing-safe';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramWebhookController {
  constructor(
    private readonly telegram: TelegramService,
    private readonly config: ConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() body: unknown,
  ) {
    const expected = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET') ?? '';
    if (!expected || !secret || !safeEqual(secret, expected)) {
      throw new UnauthorizedException('Invalid secret token');
    }

    await this.telegram.handleUpdate(body);
    return { ok: true };
  }
}
