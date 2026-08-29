# SlivaPack

Платформа публикации фото и видео. Контент добавляется **только через Telegram-бота** — веб-админки нет.

> ⚠️ **Согласие.** Публикация допускается только с подтверждённого согласия изображённых людей.
> Любое лицо может потребовать удаления контента через контакт **@heroinstead**.

## Стек

| Слой | Технология |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19 |
| Backend | NestJS 11 + Prisma 6 + PostgreSQL |
| Хранилище медиа | S3-совместимое (Cloudflare R2 / Backblaze B2) |
| Telegram-бот | Telegraf (webhook + secret token + allowlist) |

## Структура

- `apps/web` — фронтенд: лента карточек, просмотр, лайки, страницы «Политика конфиденциальности» и «Контакты».
- `apps/api` — REST API + Telegram-бот.
- `packages/shared` — общие типы.

## Безопасность

- Секреты только через переменные окружения (`.env`, в git не попадает).
- CI: gitleaks (скан секретов) + `npm audit` + сборка + тесты.
- Валидация входа (whitelist), rate limiting (Throttler), безопасные заголовки (Helmet), CORS.
- Медиа: проверка magic bytes, белый список форматов, **удаление EXIF/GPS**, лимиты размера, приватное хранилище.
- Telegram-бот: верификация webhook по `X-Telegram-Bot-Api-Secret-Token`, allowlist пользователей.
- Лайки дедуплицируются по хэшу IP+User-Agent (без хранения персональных данных).

## Локальный запуск

```bash
# 1. Зависимости
npm install

# 2. Переменные окружения
cp .env.example .env
#   - заполнить DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, S3_*

# 3. БД: миграция + генерация клиента
npm run prisma:generate -w @slivapack/api
npm run prisma:migrate -w @slivapack/api

# 4. Добавить себя в allowlist бота
#    TELEGRAM_ALLOWED_USER_ID=<ваш telegram user id> npm run prisma:seed -w @slivapack/api

# 5. Запуск
npm run start:dev -w @slivapack/api   # API на :3001
npm run dev -w @slivapack/web         # Frontend на :3000
```

## Telegram-бот

После запуска API установите webhook один раз:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://<ваш-домен>/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'
```

Локально используйте туннель (ngrok / cloudflared). Команды бота:
- отправьте фото/видео с подписью `Заголовок | Текст` — создаст черновик;
- `/publish <id>` — опубликовать;
- `/delete <id>` — удалить (статус REMOVED);
- `/list` — список опубликованных.

## Сборка и тесты

```bash
npm run build            # сборка всех пакетов
npm run test             # тесты
npm run typecheck        # проверка типов
```

## Деплой (Railway / Docker)

Сервис `api` и `web` собираются из соответствующих Dockerfiles (контекст — корень репозитория):

```bash
docker compose up --build
```

На Railway укажите Dockerfile `apps/api/Dockerfile` и `apps/web/Dockerfile` с корневым контекстом
и пропишите переменные окружения (те же, что в `.env.example`). Для фронтенда
`NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_MEDIA_URL` задаются как build args.

## Согласие и удаление контента

Контент публикуется только с согласия изображённых лиц. Для запроса на удаление — контакт **@heroinstead**.

