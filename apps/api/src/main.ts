import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Разбирает TRUST_PROXY для Express `trust proxy`.
 * - '1' / число — доверять N ступеней прокси (Railway edge — одна ступень).
 * - 'true' — доверять всем прокси.
 * - 'false' / '0' / '' — не доверять X-Forwarded-For.
 * - 'loopback' / 'linklocal' / 'uniquelocal' — только локальные прокси.
 * - IP/CIDR через запятую — доверять только конкретным адресам прокси.
 */
function parseTrustProxy(raw: string): boolean | number | string | string[] {
  const value = (raw ?? '').trim();
  if (value === '' || value === 'false' || value === '0') return false;
  if (value === 'true') return true;
  const hops = Number(value);
  if (Number.isInteger(hops) && hops >= 0) return hops;
  const list = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length > 1) return list;
  return value;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Доверяем X-Forwarded-For только когда приложение реально стоит за прокси.
  // ВНИМАНИЕ: если API доступен напрямую (без прокси), поставьте TRUST_PROXY=false,
  // иначе злоумышленник подменит X-Forwarded-For и обойдёт rate-limit и дедупликацию лайков.
  app.set('trust proxy', parseTrustProxy(config.get<string>('TRUST_PROXY') ?? '1'));

  // Безопасные HTTP-заголовки
  app.use(helmet());

  // CORS: только разрешённые origin
  const corsOrigin = (config.get<string>('CORS_ORIGIN') ?? '').trim();
  let origin: boolean | string | string[] = false;
  if (corsOrigin === '*') {
    origin = '*';
  } else if (corsOrigin) {
    origin = corsOrigin.split(',').map((o) => o.trim());
  }
  app.enableCors({
    origin,
    credentials: false,
  });

  // Глобальная валидация входа: лишние поля отбрасываются
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = config.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
