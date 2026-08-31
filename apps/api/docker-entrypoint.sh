#!/bin/sh
set -e

# Локальный Telegram Bot API Server (--local снимает лимит скачивания 20 МБ -> до ~2 ГБ)
if [ -n "$TELEGRAM_API_ID" ] && [ -n "$TELEGRAM_API_HASH" ]; then
  echo "Starting telegram-bot-api (local mode) on :8081 ..."
  telegram-bot-api \
    --api-id="$TELEGRAM_API_ID" \
    --api-hash="$TELEGRAM_API_HASH" \
    --local \
    --dir=/data/telegram-bot-api \
    --http-port=8081 &
else
  echo "TELEGRAM_API_ID/TELEGRAM_API_HASH не заданы — локальный Bot API server отключён (лимит 20 МБ)"
fi

cd /app/apps/api
exec npm start