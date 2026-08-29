import { Module } from '@nestjs/common';
import { CardsModule } from '../cards/cards.module';
import { MediaModule } from '../media/media.module';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [MediaModule, CardsModule],
  controllers: [TelegramWebhookController],
  providers: [TelegramService],
})
export class TelegramModule {}
