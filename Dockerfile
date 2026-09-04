# ==== SlivaPack API: NestJS + локальный Telegram Bot API Server (монолит) ====
# Локальный Bot API server (режим --local) снимает лимит Telegram 20 МБ -> до ~2 ГБ.

# Стадия 1: готовый бинарь локального Telegram Bot API Server
FROM aiogram/telegram-bot-api:latest AS botapi

# Стадия 2: Node-приложение
FROM node:20-alpine
WORKDIR /app

# Зависимости бинаря telegram-bot-api (Alpine/musl)
RUN apk add --no-cache openssl libstdc++

# Копируем бинарь локального Bot API server
COPY --from=botapi /usr/local/bin/telegram-bot-api /usr/local/bin/telegram-bot-api

# Исходники монорепо и зависимости
COPY . .
RUN npm ci
RUN npm run build -w @slivapack/api

WORKDIR /app/apps/api
EXPOSE 3001 8081
CMD ["npm", "start"]