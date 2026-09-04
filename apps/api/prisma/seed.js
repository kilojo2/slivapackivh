/* eslint-disable no-console */
// Добавляет/активирует пользователей Telegram в allowlist.
// Запуск: npm run prisma:seed -w @slivapack/api
// Роли:
//   TELEGRAM_ADMIN_USER_IDS (через запятую) -> admin (может /add и /remove),
//   TELEGRAM_ALLOWED_USER_IDS / TELEGRAM_ALLOWED_USER_ID -> editor.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const admins = (process.env.TELEGRAM_ADMIN_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const editors = (
    process.env.TELEGRAM_ALLOWED_USER_IDS ||
    process.env.TELEGRAM_ALLOWED_USER_ID ||
    ''
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (admins.length === 0 && editors.length === 0) {
    console.error(
      'Укажите TELEGRAM_ADMIN_USER_IDS и/или TELEGRAM_ALLOWED_USER_IDS (через запятую).',
    );
    process.exitCode = 1;
    return;
  }

  // Сначала editors, затем admins — при пересечении id побеждает роль admin.
  for (const [role, ids] of [
    ['editor', editors],
    ['admin', admins],
  ]) {
    for (const id of ids) {
      await prisma.allowedUser.upsert({
        where: { telegramUserId: id },
        update: { isActive: true, role },
        create: { telegramUserId: id, role, isActive: true },
      });
      console.log(`Allowed user (${role}) добавлен/активирован: ${id}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());