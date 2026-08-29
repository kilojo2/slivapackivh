import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { CardsService } from '../cards/cards.service';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot?: Telegraf;

  constructor(
    private readonly config: ConfigService,
    private readonly cardsService: CardsService,
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — Telegram-бот отключён');
      return;
    }

    const bot = new Telegraf(token);
    this.bot = bot;
    this.registerMiddleware(bot);
    this.registerCommands(bot);
    this.logger.log('Telegram-бот инициализирован');
  }

  onModuleDestroy() {
    this.bot?.stop('SIGTERM');
  }

  async handleUpdate(update: unknown): Promise<void> {
    if (!this.bot) return;
    await this.bot.handleUpdate(update as never);
  }

  /** Allowlist: доступ только пользователям из таблицы AllowedUser. */
  private registerMiddleware(bot: Telegraf) {
    bot.use(async (ctx: any, next: () => Promise<void>) => {
      if (!(await this.isAllowed(ctx))) {
        await ctx.reply('⛔ Доступ запрещён.');
        return;
      }
      await next();
    });
  }

  private async isAllowed(ctx: any): Promise<boolean> {
    const chatId = ctx.chat?.id ?? ctx.from?.id;
    if (!chatId) return false;
    const user = await this.prisma.allowedUser.findUnique({
      where: { telegramUserId: String(chatId) },
    });
    return !!user?.isActive;
  }

  private registerCommands(bot: Telegraf) {
    bot.start((ctx: any) =>
      ctx.reply(
        'SlivaPack-бот.\n\n' +
          'Отправьте фото или видео с подписью в формате:\n' +
          '«Заголовок | Текст»\n\n' +
          'Будет создан черновик. Опубликовать: /publish <id>.',
      ),
    );

    bot.command('list', async (ctx: any) => {
      const cards = await this.prisma.card.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, type: true, createdAt: true },
      });
      if (cards.length === 0) {
        return ctx.reply('Пока нет опубликованных карточек.');
      }
      return ctx.reply(
        cards.map((c) => `• ${c.title} (${c.type}) — ${c.id}`).join('\n'),
      );
    });

    bot.command('publish', async (ctx: any) => {
      const id = this.extractArg(ctx);
      if (!id) return ctx.reply('Формат: /publish <id>');
      const res = await this.prisma.card.updateMany({
        where: { id, status: 'DRAFT' },
        data: { status: 'PUBLISHED' },
      });
      return ctx.reply(
        res.count
          ? `✅ Опубликовано: ${id}`
          : 'Черновик не найден или уже опубликован.',
      );
    });

    bot.command('delete', async (ctx: any) => {
      const id = this.extractArg(ctx);
      if (!id) return ctx.reply('Формат: /delete <id>');
      const res = await this.prisma.card.updateMany({
        where: { id },
        data: { status: 'REMOVED' },
      });
      return ctx.reply(res.count ? `🗑 Удалено: ${id}` : 'Карточка не найдена.');
    });

    bot.on(['photo', 'video'], (ctx: any) => this.handleMedia(ctx));
  }

  private extractArg(ctx: any): string | undefined {
    const text: string = ctx.message?.text ?? '';
    return text.trim().split(/\s+/)[1];
  }

  private async handleMedia(ctx: any) {
    const caption: string = ctx.message?.caption ?? '';
    const [title, ...rest] = caption.split('|').map((s: string) => s.trim());
    const text = rest.join(' | ').trim();

    if (!title) {
      return ctx.reply('Нужна подпись в формате: «Заголовок | Текст»');
    }

    const isVideo = !!ctx.message.video;
    const photo = ctx.message.photo;
    const fileId = isVideo
      ? ctx.message.video.file_id
      : photo?.[photo.length - 1]?.file_id;

    if (!fileId) {
      return ctx.reply('Не удалось определить файл.');
    }

    const size = isVideo
      ? ctx.message.video.file_size
      : photo?.[photo.length - 1]?.file_size;
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (size && size > maxSize) {
      return ctx.reply('Файл слишком большой.');
    }

    try {
      const link = await ctx.telegram.getFileLink(fileId);
      const res = await fetch(String(link));
      if (!res.ok) {
        throw new Error(`download failed: ${res.status}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());

      const media = isVideo
        ? await this.mediaService.processVideo(buffer)
        : await this.mediaService.processImage(buffer);

      const card = await this.cardsService.create({
        type: isVideo ? 'VIDEO' : 'PHOTO',
        title,
        text,
        mediaKey: media.key,
        authorUserId: String(ctx.from?.id ?? ''),
        status: 'DRAFT',
      });

      return ctx.reply(
        `✅ Черновик создан (id: ${card.id}).\nОпубликовать: /publish ${card.id}`,
      );
    } catch (error) {
      this.logger.error('Ошибка обработки медиа', error as Error);
      return ctx.reply('Ошибка обработки файла. Проверьте формат и размер.');
    }
  }
}
