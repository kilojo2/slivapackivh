/* eslint-disable no-console */
// Добавляет/активирует пользователей Telegram в allowlist.
// Запуск: npm run prisma:seed -w @slivapack/api
// Требует: TELEGRAM_ALLOWED_USER_IDS (через запятую) или TELEGRAM_ALLOWED_USER_ID.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const raw =
    process.env.TELEGRAM_ALLOWED_USER_IDS ||
    process.env.TELEGRAM_ALLOWED_USER_ID ||
    '';
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    console.error(
      'Укажите TELEGRAM_ALLOWED_USER_IDS (через запятую) или TELEGRAM_ALLOWED_USER_ID.',
    );
    process.exitCode = 1;
    return;
  }

  for (const id of ids) {
    await prisma.allowedUser.upsert({
      where: { telegramUserId: id },
      update: { isActive: true },
      create: { telegramUserId: id, role: 'editor', isActive: true },
    });
    console.log(`Allowed user добавлен/активирован: ${id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());