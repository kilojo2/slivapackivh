import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Доверяем первому reverse-proxy (Cloudflare/Railway), чтобы корректно читать IP.
  // ВАЖНО: включать только когда приложение реально стоит за прокси.
  app.set('trust proxy', 1);

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
