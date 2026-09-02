#!/bin/sh
set -e

check() {
  if [ -n "$1" ]; then echo -n "SET"; else echo -n "UNSET"; fi
}

echo "ENV CHECK: DB=$(check "$DATABASE_URL") TG_TOKEN=$(check "$TELEGRAM_BOT_TOKEN") WEBHOOK_SECRET=$(check "$TELEGRAM_WEBHOOK_SECRET") API_ID=$(check "$TELEGRAM_API_ID") API_HASH=$(check "$TELEGRAM_API_HASH") API_ROOT=$(check "$TELEGRAM_API_ROOT") WEBHOOK_URL=$(check "$TELEGRAM_WEBHOOK_URL") S3_BUCKET=$(check "$S3_BUCKET")"

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