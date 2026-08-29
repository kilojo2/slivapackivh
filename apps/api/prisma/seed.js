/* eslint-disable no-console */
// Добавляет/активирует пользователя Telegram в allowlist (кто может публиковать).
// Запуск: npm run prisma:seed -w @slivapack/api
// Требует: TELEGRAM_ALLOWED_USER_ID и рабочую DATABASE_URL.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const userId = process.env.TELEGRAM_ALLOWED_USER_ID;
  if (!userId) {
    console.error(
      'Укажите TELEGRAM_ALLOWED_USER_ID (Telegram user id того, кому разрешено публиковать).',
    );
    process.exitCode = 1;
    return;
  }

  await prisma.allowedUser.upsert({
    where: { telegramUserId: userId },
    update: { isActive: true },
    create: { telegramUserId: userId, role: 'editor', isActive: true },
  });

  console.log(`Allowed user добавлен/активирован: ${userId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
