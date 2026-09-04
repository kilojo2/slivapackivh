import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CardsModule } from './cards/cards.module';
import { TelegramModule } from './telegram/telegram.module';
import { StatsModule } from './stats/stats.module';
import { AdminModule } from './admin/admin.module';
import configuration from './config/configuration';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // Базовый rate limit: 120 запросов/мин с одного IP.
    // Более строгие лимиты будут на конкретных эндпоинтах (лайк/просмотр).
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
      // Глобальный (не по IP) лимит на вход в админку: даже при подмене
      // X-Forwarded-For перебор пароля ограничен 30 попытками/мин на весь сервис.
      // Применяется только к AdminController.login (для остальных маршрутов skipIf).
      {
        name: 'login-global',
        ttl: 60_000,
        limit: 30,
        getTracker: () => 'global',
        skipIf: (context: ExecutionContext) =>
          context.getClass().name !== 'AdminController' ||
          context.getHandler().name !== 'login',
      },
    ]),
    PrismaModule,
    CardsModule,
    TelegramModule,
    StatsModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [HealthController],
})
export class AppModule {}
