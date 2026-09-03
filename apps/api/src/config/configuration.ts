export interface Env {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  CORS_ORIGIN: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  TELEGRAM_ALLOWED_CHAT_IDS: string;
  TELEGRAM_API_ROOT: string;
  TELEGRAM_WEBHOOK_URL: string;
  ADMIN_TOKEN: string;
}

export default (): Env => ({
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? '',
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET ?? '',
  TELEGRAM_ALLOWED_CHAT_IDS: process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? '',
  TELEGRAM_API_ROOT: process.env.TELEGRAM_API_ROOT ?? 'https://api.telegram.org',
  TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL ?? '',
  ADMIN_TOKEN: process.env.ADMIN_TOKEN ?? '',
});
