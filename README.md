# SlivaPack

Платформа публикации фото и видео. Контент создаётся **только через Telegram-бота** — веб-интерфейс для добавления постов отсутствует. В проекте три приложения: публичный сайт, REST API + Telegram-бот и отдельная админ-панель.

> ⚠️ **Согласие.** Публикация допускается только с подтверждённого согласия изображённых людей. Любое лицо может потребовать удаления контента через контакт **@heroinstead**.

---

## Обзор

| Приложение | Путь | Назначение |
|---|---|---|
| Веб (публичный сайт) | `apps/web` | Лента карточек, просмотр, лайки, поиск, темы, избранное |
| API | `apps/api` | REST API, Telegram-бот, API админ-панели |
| Админ-панель | `apps/admin` | Управление карточками/пользователями + статистика посещений |

Это **монорепозиторий** на npm workspaces (`apps/*`, `packages/*`).

---

## Стек

| Слой | Технологии |
|---|---|
| Фронтенд (web) | Next.js 16 (App Router, Turbopack), React 19, TypeScript 6, lucide-react |
| Админка | Next.js 16, React 19, TypeScript 6 |
| Бэкенд | NestJS 11, Prisma 6.19, PostgreSQL 16 |
| Telegram-бот | Telegraf 4.16 (webhook + secret token + allowlist) |
| Обработка медиа | sharp 0.35 (удаление EXIF, WebP, resize) |
| Хранилище | S3-совместимое (R2 / B2 и т.п.) через AWS SDK v3 |
| Локальный Bot API Server | бинарь `telegram-bot-api` (режим `--local`, лимит до ~2 ГБ) |
| Деплой | Railway, Docker (`node:20-alpine`) |

---

## Структура репозитория

```
.
├── apps/
│   ├── web/          # публичный сайт (Next.js)
│   │   ├── app/      # маршруты: /, /new, /onlyfans, /tiktok, /popular,
│   │   │             #          /favorites, /search, /contacts, /privacy
│   │   ├── components/
│   │   │   ├── SiteHeader.tsx   # floating glass-навбар
│   │   │   ├── SiteNav.tsx      # навигация со скользящей «капсулой»
│   │   │   ├── brand/Logo.tsx   # логотип (mark + wordmark)
│   │   │   ├── brand/LogoMark.tsx # SVG-знак (переиспользуемый)
│   │   │   ├── Feed.tsx         # лента + фильтры + infinite scroll
│   │   │   ├── CardItem.tsx     # карточка
│   │   │   ├── Modal.tsx        # просмотр медиа
│   │   │   ├── SearchInput.tsx
│   │   │   └── VisitTracker.tsx # счётчик посещений
│   │   └── lib/ (api.ts, types.ts)
│   ├── api/           # NestJS (API + бот + админ-API)
│   │   ├── src/
│   │   │   ├── cards/     # публичные карточки (лента, лайки, города)
│   │   │   ├── media/     # S3 + sharp (storage.service, media.service)
│   │   │   ├── telegram/  # бот (service, menus, session, webhook)
│   │   │   ├── stats/     # счётчик посещений
│   │   │   ├── admin/     # админ-панель API (auth, guard, cards/users)
│   │   │   ├── common/    # timing-safe, visitor hash
│   │   │   ├── config/    # configuration.ts (env)
│   │   │   └── prisma/    # PrismaService, PrismaModule
│   │   └── prisma/        # schema.prisma + migrations + seed.js
│   └── admin/         # админ-панель (Next.js)
│       ├── app/       # /login, /dashboard, /cards, /users
│       ├── components/AdminShell.tsx
│       └── lib/api.ts
├── Dockerfile        # сборка API (корень репозитория)
├── docker-compose.yml
├── .env.example
├── package.json      # workspaces + скрипты
└── package-lock.json
```
## Возможности

### Публичный сайт (`apps/web`)
- Адаптивная сетка карточек (1/2/3/4/5 колонок по брейкпоинтам).
- Карточка: 4:5, hover-анимации, бейджи (фото/видео), несколько медиа.
- Разделы: Лента, **New** (добавленные за 2 дня), **OnlyFans**, **TikTok**, **Популярное**, **Избранное**.
- Поиск и фильтры (тип, возраст, город).
- Избранное — хранится в localStorage.
- Просмотр медиа в модальном окне (слайдер фото/видео).
- Лайки (дедупликация по анонимному хэшу посетителя).
- Floating glass-навбар: скользящая активная «капсула» (градиент pink→purple), иконки Lucide, glow при движении мыши, реакция на скролл.
- Логотип: переиспользуемый SVG-знак + wordmark «SLIVA + PACK» (градиент), favicon.
- Sticky footer, мобильная адаптация (safe-area, нижняя навигация, infinite scroll).

### Telegram-бот (`apps/api`)
- Приём апдейтов через webhook с проверкой `X-Telegram-Bot-Api-Secret-Token`.
- Allowlist пользователей (таблица `AllowedUser`).
- Мастер создания карточки: медиа → заголовок → описание → возраст → город → источник.
- Управление карточками: опубликовать / снять / восстановить, изменить заголовок/описание/источник, добавить медиа, удалить / удалить навсегда.
- Медиа-группы (несколько фото/видео одним сообщением).
- Сессии диалога в БД (`BotSession`).
- Локальный Bot API Server (лимит ~2 ГБ) с автоматическим fallback на облако (20 МБ).

### Админ-панель (`apps/admin` + API)
- Вход по паролю с подписанными сессионными токенами.
- Дашборд: посещения за сегодня / всего / по дням.
- Карточки: список с фильтрами (статус/источник/поиск), редактирование, смена статуса, удаление.
- Пользователи (allowlist): добавить / удалить.
- Создание постов в админке **отсутствует** — только через бота.

---

## База данных (Prisma)

### Модели

| Модель | Поля | Назначение |
|---|---|---|
| `Card` | id, title (≤200), text, age?, city?, source?, status, authorUserId?, viewCount, createdAt, updatedAt | карточка (пост) |
| `Media` | id, cardId, type, mediaKey, sort, createdAt | медиа-файлы карточки |
| `Like` | id, cardId, visitorHash, createdAt | лайки (уникальны по visitorHash) |
| `AllowedUser` | id, telegramUserId (unique), role, isActive, createdAt | allowlist бота |
| `RemovalRequest` | id, cardId?, reason, status, createdAt | запросы на удаление |
| `MediaHash` | id, phash (unique), status, createdAt | заблокированные хэши медиа |
| `BotSession` | id, userId (unique), data?, createdAt, updatedAt | состояние диалога бота |
| `DailyVisit` | id, date (unique), count, createdAt, updatedAt | счётчик посещений по дням |

### Перечисления
- `CardType`: `PHOTO`, `VIDEO`.
- `CardStatus`: `DRAFT`, `PUBLISHED`, `REMOVED`.

Поле `source` — источник карточки (`onlyfans` | `tiktok` | null), используется темами New/OnlyFans/TikTok на сайте.

---

## Переменные окружения

См. `.env.example` (полный список с комментариями).

| Переменная | Куда | Описание |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | api | токен бота от @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | api | секрет верификации webhook |
| `TELEGRAM_API_ROOT` | api | `https://api.telegram.org` или `http://localhost:8081` (локальный сервер) |
| `TELEGRAM_WEBHOOK_URL` | api | публичный URL webhook (для облака) |
| `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` | api | для локального Bot API Server (my.telegram.org) |
| `ADMIN_TOKEN` | api | пароль админ-панели (≥16 символов) |
| `DATABASE_URL` | api | строка подключения PostgreSQL |
| `CORS_ORIGIN` | api | список разрешённых origin (через запятую) |
| `S3_ENDPOINT` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_BUCKET` / `S3_REGION` / `S3_PUBLIC_URL` | api | S3-совместимое хранилище |
| `PORT` | api | порт API (по умолчанию 3001) |
| `NODE_ENV` | api | `development` / `production` |
| `NEXT_PUBLIC_API_URL` | web, admin | публичный URL API (с `/api`) |
| `NEXT_PUBLIC_MEDIA_URL` | web | публичный URL медиа |

> `TELEGRAM_ALLOWED_CHAT_IDS` в `.env.example` — устаревшая переменная (allowlist теперь в БД через `/add` или админку/seed).
>
> Роли в `AllowedUser`: `admin` (может `/add` и `/remove`) и `editor` (только публикация). Первого админа заводит seed через `TELEGRAM_ADMIN_USER_IDS`, либо админ-панель (`/users`).
## Безопасность

- **HTTP**: Helmet, CORS по allowlist (`CORS_ORIGIN`), глобальная валидация (`whitelist` + `forbidNonWhitelisted`), rate limiting (Throttler, 120 запр./мин).
- **IP/прокси**: `trust proxy` управляется `TRUST_PROXY` (по умолчанию `1` — одна ступень Railway edge). Если API доступен напрямую — ставить `false`, иначе `X-Forwarded-For` подделывается (обход rate-limit и накрутка лайков).
- **Сравнение секретов** — в постоянное время (`timingSafeEqual`) для webhook-секрета и пароля админки (защита от timing-атак).
- **Медиа**: проверка magic bytes (не по расширению), белый список форматов, удаление EXIF/GPS, лимиты размера/разрешения, приватное S3 (подписанные URL).
- **Бот**: webhook-секрет + allowlist (`AllowedUser`), лайки по анонимному хэшу (IP+User-Agent, без хранения IP).
- **Посещения**: только счётчик по дням (`DailyVisit`) — без IP, cookie и персональных данных.
- **Админка**: подписанные сессионные токены (HMAC-SHA256, TTL 12 ч), жёсткий rate-limit на вход (5/мин с IP) + глобальный лимит 30 входов/мин на весь сервис (не зависит от IP), пароль в постоянное время.

---

## Локальный запуск

```bash
# 1. Зависимости
npm install

# 2. Переменные окружения
cp .env.example .env
# заполнить: DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, S3_*, ADMIN_TOKEN

# 3. БД: генерация клиента + миграции
npm run prisma:generate -w @slivapack/api
npm run prisma:migrate -w @slivapack/api

# 4. Добавить себя в allowlist бота (опционально)
TELEGRAM_ALLOWED_USER_ID=<ваш telegram id> npm run prisma:seed -w @slivapack/api

# 5. Запуск (три терминала)
npm run start:dev -w @slivapack/api    # API + бот на :3001
npm run dev -w @slivapack/web          # сайт на :3000
npm run dev -w @slivapack/admin        # админка на :3002
```

Для webhook локально нужен публичный URL (ngrok / cloudflared) или облачный режим с публичным `TELEGRAM_WEBHOOK_URL`.

---

## Telegram-бот

### Команды
- `/start`, `/help`, `/menu` — главное меню.
- `/add <id>` — добавить пользователя в allowlist (только `admin`).
- `/remove <id>` — убрать пользователя (только `admin`).

### Создание карточки (мастер)
1. Отправить фото/видео (можно несколько) → «Добавлено» → кнопка «Готово».
2. Заголовок.
3. Описание (или «Пропустить»).
4. Возраст 18–99 (или «Пропустить»).
5. Город (или «Пропустить»).
6. Источник: `OnlyFans` / `TikTok` / «Пропустить».
7. Карточка сохраняется со статусом **DRAFT**.

### Управление карточкой (кнопки)
`✅ Опубликовать` / `⏸ Снять` / `♻️ Восстановить` · `✏️ Заголовок` / `✏️ Описание` · `➕ Добавить медиа` · `🏷 Источник` (`OnlyFans`/`TikTok`/`❌ Убрать`) · `🗑 Удалить` / `🗑 Навсегда`.

### Webhook
При старте API сам вызывает `setWebhook` (с ретраями) на нужный endpoint (локальный или облачный) и удаляет «лишний» webhook, чтобы апдейты не дублировались.

---

## Админ-панель

- URL: `/login` (вход по паролю `ADMIN_TOKEN`), `/dashboard`, `/cards`, `/users`.
- Сессия живёт 12 часов, токен хранится в `sessionStorage`, отправляется как `Authorization: Bearer`.
- Карточки: фильтры (статус/источник/поиск), редактирование, `Снять` (→ REMOVED), `Удалить` (полное, с медиа из S3).
- Пользователи: добавление по Telegram id, удаление.

---

## Деплой (Railway)

4 сервиса:

| Сервис | Root Directory | Сборка |
|---|---|---|
| api | `.` (корень) | Dockerfile (корневой `Dockerfile`) |
| database | — | PostgreSQL |
| web | `apps/web` | Railpack/Nixpacks (Next.js) |
| admin | `apps/admin` | Railpack/Nixpacks (Next.js) |

- `Dockerfile` (корень): `node:20-alpine` + бинарь `telegram-bot-api` (из `aiogram/telegram-bot-api`), `npm ci`, `npm run build -w @slivapack/api`, `CMD npm start`.
- `npm start` = `prisma migrate deploy && node dist/main.js` — миграции применяются при старте.
- Локальный Bot API Server поднимается прямо из Node (`spawnLocalBotApi`) и используется, если заданы `TELEGRAM_API_ID`/`TELEGRAM_API_HASH`; иначе — облако (20 МБ).

---

## Медиа-пайплайн

- **Фото**: magic bytes → `sharp` (rotate по EXIF, resize до 1600px, WebP 82%) → S3. EXIF/GPS удаляются.
- **Видео**: magic bytes (mp4) → S3 без перекодирования.
- **Лимиты**: фото 10 МБ / 40 МП; видео 20 МБ (облако) или ~2 ГБ (локальный сервер).
- **Большие видео** стримятся с диска в S3 (`uploadStream`), не грузятся целиком в память.

---

## Трекинг посещений

- `POST /api/stats/track` — вызывается при загрузке страницы (`VisitTracker`).
- `GET /api/stats` — сегодня / всего / по дням (30 дней).
- Хранится только `date → count` (модель `DailyVisit`). Никаких IP, cookie или данных о посетителях.

---

## Скрипты

```bash
npm run build            # сборка всех пакетов
npm run typecheck        # проверка типов
npm run test             # тесты (media.util.test.mjs)
npm run audit            # npm audit

npm run build -w @slivapack/api       # prisma generate + nest build
npm run start -w @slivapack/api       # миграции + запуск
```

---

## Примечания

- `docker-compose.yml` устарел (ссылается на `apps/api/Dockerfile`, который перенесён в корень; `web`/`admin` собираются через Railpack без Dockerfile).
- Создание постов — **только через Telegram-бота**. Админка и сайт не умеют добавлять посты.
- Для запроса на удаление контента — контакт **@heroinstead**.