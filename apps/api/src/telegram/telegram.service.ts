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
import { StorageService } from '../media/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import * as menus from './telegram.menus';
import {
  getSession,
  resetSession,
  setSession,
  type DraftData,
  type MediaItem,
  type SessionData,
} from './telegram.session';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot?: Telegraf;
  private mediaGroups = new Map<
    string,
    {
      userId: string;
      items: { type: 'PHOTO' | 'VIDEO'; fileId: string; size?: number }[];
      timer?: ReturnType<typeof setTimeout>;
      ctx: any;
    }
  >();

  constructor(
    private readonly config: ConfigService,
    private readonly cardsService: CardsService,
    private readonly mediaService: MediaService,
    private readonly storage: StorageService,
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
    this.registerHandlers(bot);
    this.logger.log('Telegram-бот инициализирован');
  }

  onModuleDestroy() {
    this.bot?.stop('SIGTERM');
  }

  async handleUpdate(update: unknown): Promise<void> {
    if (!this.bot) return;
    await this.bot.handleUpdate(update as never);
  }

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

  private uid(ctx: any): string {
    return String(ctx.from?.id ?? '');
  }

  private registerHandlers(bot: Telegraf) {
    bot.start((ctx: any) => this.showMainMenu(ctx));
    bot.help((ctx: any) => this.showHelp(ctx));
    bot.command('menu', (ctx: any) => this.showMainMenu(ctx));
    bot.command('add', (ctx: any) => this.handleAddUser(ctx));
    bot.command('remove', (ctx: any) => this.handleRemoveUser(ctx));
    bot.on('callback_query', (ctx: any) => this.handleCallback(ctx));
    bot.on('text', (ctx: any) => this.handleText(ctx));
    bot.on('photo', (ctx: any) => this.handlePhoto(ctx));
    bot.on('video', (ctx: any) => this.handleVideo(ctx));
  }

  private async handleAddUser(ctx: any) {
    const arg = (ctx.message?.text ?? '').trim().split(/\s+/)[1];
    const userId = (arg ?? '').replace(/[^0-9]/g, '');
    if (!userId) {
      return ctx.reply('Формат: /add <числовой id>\nНапример: /add 123456789');
    }
    await this.prisma.allowedUser.upsert({
      where: { telegramUserId: userId },
      update: { isActive: true },
      create: { telegramUserId: userId, role: 'editor', isActive: true },
    });
    await ctx.reply(`✅ Пользователь ${userId} добавлен в доступ.`);
  }

  private async handleRemoveUser(ctx: any) {
    const arg = (ctx.message?.text ?? '').trim().split(/\s+/)[1];
    const userId = (arg ?? '').replace(/[^0-9]/g, '');
    if (!userId) {
      return ctx.reply('Формат: /remove <числовой id>');
    }
    await this.prisma.allowedUser.updateMany({
      where: { telegramUserId: userId },
      data: { isActive: false },
    });
    await ctx.reply(`🗑 Пользователь ${userId} отключён.`);
  }

  private async answerCb(ctx: any, text?: string) {
    try {
      await ctx.answerCbQuery(text);
    } catch {
      /* ignore */
    }
  }

  private async render(ctx: any, text: string, keyboard: any) {
    try {
      await ctx.editMessageText(text, { reply_markup: keyboard });
    } catch {
      await ctx.reply(text, { reply_markup: keyboard });
    }
  }

  private async downloadMedia(ctx: any, fileId: string): Promise<Buffer> {
    const link = await ctx.telegram.getFileLink(fileId);
    const res = await fetch(String(link));
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  private cardCaption(card: { title: string; text: string; viewCount: number }): string {
    return `${card.title}\n\n${card.text || '—'}`;
  }

  private async showCard(ctx: any, cardId: string, edit: boolean, prefix?: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        media: { orderBy: { sort: 'asc' } },
        _count: { select: { likes: true } },
      },
    });
    if (!card) {
      await this.answerCb(ctx, 'Карточка не найдена');
      return;
    }
    const status =
      card.status === 'PUBLISHED'
        ? '🟢 Опубликована'
        : card.status === 'DRAFT'
          ? '🟡 Черновик'
          : '🔴 Удалена';
    const caption = `${prefix ? prefix + '\n\n' : ''}${this.cardCaption(card)}\n\n${status} · ❤️ ${card._count.likes} · 👁 ${card.viewCount}`;
    const keyboard = menus.cardActions(card);
    if (edit) {
      try {
        await ctx.editMessageCaption(caption, { reply_markup: keyboard });
        return;
      } catch {
        /* fall through to send */
      }
    }
    const first = card.media?.[0];
    if (!first) return;
    const media = await this.storage.download(first.mediaKey);
    if (first.type === 'PHOTO') {
      await ctx.replyWithPhoto({ source: media }, { caption, reply_markup: keyboard });
    } else {
      await ctx.replyWithVideo({ source: media }, { caption, reply_markup: keyboard });
    }
  }
  private async showMainMenu(ctx: any) {
    await this.render(ctx, '🏠 Главное меню\n\nЧто хотите сделать?', menus.MAIN_MENU);
  }

  private async showHelp(ctx: any) {
    await this.render(
      ctx,
      '❓ Как пользоваться\n\n1. Нажмите «➕ Добавить».\n2. Выберите фото или видео.\n3. Пришлите файл.\n4. Напишите заголовок и описание.\n5. Нажмите «Опубликовать».\n\nКнопка «🏠 В меню» вернёт вас сюда в любой момент.',
      menus.BACK_TO_MENU,
    );
  }

  private async showStats(ctx: any) {
    const [total, published, drafts, removed, likes, viewsAgg] = await Promise.all([
      this.prisma.card.count(),
      this.prisma.card.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.card.count({ where: { status: 'DRAFT' } }),
      this.prisma.card.count({ where: { status: 'REMOVED' } }),
      this.prisma.like.count(),
      this.prisma.card.aggregate({ _sum: { viewCount: true } }),
    ]);
    const views = viewsAgg._sum.viewCount ?? 0;
    await this.render(
      ctx,
      `📊 Статистика\n\n📦 Всего: ${total}\n🟢 Опубликовано: ${published}\n🟡 Черновики: ${drafts}\n🔴 Удалено: ${removed}\n❤️ Лайков: ${likes}\n👁 Просмотров: ${views}`,
      menus.BACK_TO_MENU,
    );
  }

  private async showListFilters(ctx: any) {
    const [published, drafts, removed] = await Promise.all([
      this.prisma.card.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.card.count({ where: { status: 'DRAFT' } }),
      this.prisma.card.count({ where: { status: 'REMOVED' } }),
    ]);
    await this.render(ctx, '📋 Мои карточки\n\nВыберите раздел:', menus.listFilters(published, drafts, removed));
  }

  private async showCardList(ctx: any, status: 'PUBLISHED' | 'DRAFT' | 'REMOVED') {
    const cards = await this.prisma.card.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, title: true },
    });
    if (cards.length === 0) {
      await this.render(ctx, 'Здесь пока пусто.', menus.BACK_TO_MENU);
      return;
    }
    await this.render(ctx, `Найдено карточек: ${cards.length}\n\nВыберите карточку:`, menus.cardList(cards));
  }

  private async handleCallback(ctx: any) {
    const data: string = ctx.callbackQuery?.data ?? '';
    await this.answerCb(ctx);

    if (data === 'menu') return this.showMainMenu(ctx);
    if (data === 'menu:add') return this.startAdd(ctx);
    if (data === 'menu:list') return this.showListFilters(ctx);
    if (data === 'menu:stats') return this.showStats(ctx);
    if (data === 'menu:help') return this.showHelp(ctx);

    if (data === 'add:media_done') return this.finishMedia(ctx);
    if (data === 'add:more_media') return this.moreMedia(ctx);
    if (data === 'add:skip_text') return this.saveAddText(ctx, '');
    if (data === 'add:skip_age') return this.skipAge(ctx);
    if (data === 'add:skip_city') return this.skipCity(ctx);
    if (data === 'add:publish') return this.commitAdd(ctx, 'PUBLISHED');
    if (data === 'add:save_draft') return this.commitAdd(ctx, 'DRAFT');
    if (data === 'add:edit_title') return this.editAddTitle(ctx);
    if (data === 'add:edit_text') return this.editAddText(ctx);
    if (data === 'add:cancel') return this.cancelAdd(ctx);

    if (data === 'list:published') return this.showCardList(ctx, 'PUBLISHED');
    if (data === 'list:drafts') return this.showCardList(ctx, 'DRAFT');
    if (data === 'list:removed') return this.showCardList(ctx, 'REMOVED');

    if (data.startsWith('card:')) {
      const parts = data.split(':');
      if (parts.length === 2) return this.showCard(ctx, parts[1], false);
      const [, action, id] = parts;
      if (action === 'edit') return this.showCard(ctx, id, true);
      if (action === 'publish') return this.setCardStatus(ctx, id, 'PUBLISHED');
      if (action === 'unpublish') return this.setCardStatus(ctx, id, 'DRAFT');
      if (action === 'restore') return this.setCardStatus(ctx, id, 'DRAFT');
      if (action === 'delete') return this.askDelete(ctx, id);
      if (action === 'purge') return this.askPurge(ctx, id);
      if (action === 'edit_title') return this.editCardTitle(ctx, id);
      if (action === 'edit_text') return this.editCardText(ctx, id);
      if (action === 'append') return this.appendCardMedia(ctx, id);
    }

    if (data.startsWith('confirm:delete:')) return this.confirmDelete(ctx, data.split(':')[2]);
    if (data.startsWith('confirm:purge:')) return this.confirmPurge(ctx, data.split(':')[2]);

    return this.showMainMenu(ctx);
  }
  private async startAdd(ctx: any) {
    await setSession(this.prisma, this.uid(ctx), {
      step: 'awaiting_media',
      draft: { media: [] },
    });
    await ctx.reply('📷🎬 Пришлите фото или видео (можно несколько, по одному).');
  }

  private async handleText(ctx: any) {
    const uid = this.uid(ctx);
    const session = await getSession(this.prisma, uid);
    if (!session) return this.showMainMenu(ctx);
    const text: string = ctx.message?.text ?? '';

    switch (session.step) {
      case 'awaiting_title':
        return this.saveAddTitle(ctx, session, text);
      case 'awaiting_text':
        return this.saveAddText(ctx, text);
      case 'awaiting_age':
        return this.saveAddAge(ctx, session, text);
      case 'awaiting_city':
        return this.saveAddCity(ctx, session, text);
      case 'awaiting_add_title':
        return this.saveAddTitleEdit(ctx, session, text);
      case 'awaiting_add_text':
        return this.saveAddTextEdit(ctx, session, text);
      case 'awaiting_edit_title':
        return this.saveCardTitle(ctx, session, text);
      case 'awaiting_edit_text':
        return this.saveCardText(ctx, session, text);
      default:
        return this.showMainMenu(ctx);
    }
  }

  private async handlePhoto(ctx: any) {
    const photo = ctx.message?.photo;
    const fileId = photo?.[photo.length - 1]?.file_id;
    if (!fileId) return this.showMainMenu(ctx);
    return this.enqueueMedia(ctx, 'PHOTO', fileId, photo?.[photo.length - 1]?.file_size);
  }

  private async handleVideo(ctx: any) {
    const fileId = ctx.message?.video?.file_id;
    if (!fileId) return this.showMainMenu(ctx);
    return this.enqueueMedia(ctx, 'VIDEO', fileId, ctx.message?.video?.file_size);
  }

  private async enqueueMedia(ctx: any, type: 'PHOTO' | 'VIDEO', fileId: string, size?: number) {
    const groupId = ctx.message?.media_group_id;
    if (!groupId) {
      return this.processSingleMedia(ctx, type, fileId);
    }

    const existing = this.mediaGroups.get(groupId);
    if (existing) {
      existing.items.push({ type, fileId, size });
      existing.ctx = ctx;
      if (existing.timer) clearTimeout(existing.timer);
    } else {
      this.mediaGroups.set(groupId, {
        userId: this.uid(ctx),
        items: [{ type, fileId, size }],
        ctx,
      });
    }
    const entry = this.mediaGroups.get(groupId)!;
    entry.timer = setTimeout(() => this.flushMediaGroup(groupId), 400);
  }

  private async processSingleMedia(ctx: any, type: 'PHOTO' | 'VIDEO', fileId: string) {
    const session = await getSession(this.prisma, this.uid(ctx));
    if (session?.step === 'awaiting_media') return this.addMediaToDraft(ctx, session, type, fileId);
    if (session?.step === 'awaiting_append_media') return this.appendMediaToCard(ctx, session, type, fileId);
    return this.showMainMenu(ctx);
  }

  private async flushMediaGroup(groupId: string) {
    const entry = this.mediaGroups.get(groupId);
    this.mediaGroups.delete(groupId);
    if (!entry) return;

    const ctx = entry.ctx;
    const maxOf = (type: 'PHOTO' | 'VIDEO') =>
      type === 'VIDEO' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;

    if (entry.items.some((i) => i.size && i.size > maxOf(i.type))) {
      await ctx.reply('❌ Один из файлов слишком большой.');
      return;
    }

    const processed: MediaItem[] = [];
    try {
      for (const item of entry.items) {
        processed.push(await this.processMediaFile(ctx, item.fileId, item.type));
      }
    } catch (e) {
      this.logger.error('flushMediaGroup', e as Error);
      await ctx.reply('❌ Не удалось обработать файлы. Попробуйте снова.');
      return;
    }

    const session = await getSession(this.prisma, entry.userId);

    if (session?.step === 'awaiting_media') {
      const draft = session.draft ?? {};
      const items = [...(draft.media ?? []), ...processed];
      await setSession(this.prisma, entry.userId, {
        step: 'awaiting_media',
        draft: { ...draft, media: items },
      });
      await ctx.reply(
        `✅ Добавлено ${processed.length} файлов (всего: ${items.length}). Пришлите ещё или нажмите «Готово».`,
        { reply_markup: menus.MEDIA_MORE },
      );
    } else if (session?.step === 'awaiting_append_media' && session.editingCardId) {
      const id = session.editingCardId;
      const last = await this.prisma.media.findFirst({
        where: { cardId: id },
        orderBy: { sort: 'desc' },
        select: { sort: true },
      });
      let sort = (last?.sort ?? -1) + 1;
      for (const m of processed) {
        await this.prisma.media.create({
          data: { cardId: id, type: m.type, mediaKey: m.mediaKey, sort: sort++ },
        });
      }
      await resetSession(this.prisma, entry.userId);
      await ctx.reply(`✅ Добавлено ${processed.length} файлов.`);
      await this.showCard(ctx, id, false);
    } else {
      await this.showMainMenu(ctx);
    }
  }

  private async processMediaFile(ctx: any, fileId: string, type: 'PHOTO' | 'VIDEO'): Promise<MediaItem> {
    const buffer = await this.downloadMedia(ctx, fileId);
    const media = type === 'VIDEO'
      ? await this.mediaService.processVideo(buffer)
      : await this.mediaService.processImage(buffer);
    return { type, mediaKey: media.key };
  }

  private async addMediaToDraft(ctx: any, session: SessionData, type: 'PHOTO' | 'VIDEO', fileId: string) {
    const photo = ctx.message?.photo;
    const size = type === 'VIDEO' ? ctx.message?.video?.file_size : photo?.[photo.length - 1]?.file_size;
    const max = type === 'VIDEO' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (size && size > max) {
      await ctx.reply('❌ Файл слишком большой.');
      return;
    }
    try {
      const buffer = await this.downloadMedia(ctx, fileId);
      const media = type === 'VIDEO'
        ? await this.mediaService.processVideo(buffer)
        : await this.mediaService.processImage(buffer);
      const items = [...(session.draft?.media ?? []), { type, mediaKey: media.key }];
      await setSession(this.prisma, this.uid(ctx), {
        step: 'awaiting_media',
        draft: { ...(session.draft ?? {}), media: items },
      });
      await ctx.reply(`✅ Добавлено (всего: ${items.length}). Пришлите ещё или нажмите «Готово».`, { reply_markup: menus.MEDIA_MORE });
    } catch (e) {
      this.logger.error('addMediaToDraft', e as Error);
      await ctx.reply('❌ Не удалось обработать файл. Попробуйте другой.');
    }
  }

  private async finishMedia(ctx: any) {
    const session = await getSession(this.prisma, this.uid(ctx));
    if (!session?.draft?.media?.length) {
      await this.answerCb(ctx, 'Добавьте хотя бы одно фото или видео');
      return;
    }
    await setSession(this.prisma, this.uid(ctx), { step: 'awaiting_title', draft: session.draft });
    await ctx.reply('Теперь пришлите заголовок (одной строкой).');
  }

  private async moreMedia(ctx: any) {
    const session = await getSession(this.prisma, this.uid(ctx));
    await setSession(this.prisma, this.uid(ctx), { step: 'awaiting_media', draft: session?.draft });
    await ctx.reply('Пришлите ещё фото или видео (или нажмите «Готово»).', { reply_markup: menus.MEDIA_MORE });
  }
  private async saveAddTitle(ctx: any, session: SessionData, title: string) {
    if (title.trim().length > 200) {
      await ctx.reply('❌ Заголовок слишком длинный (максимум 200 символов). Пришлите короче.');
      return;
    }
    await setSession(this.prisma, this.uid(ctx), {
      step: 'awaiting_text',
      draft: { ...(session.draft ?? {}), title: title.trim() },
    });
    await ctx.reply('Теперь напишите описание (или нажмите «Пропустить»).', { reply_markup: menus.SKIP_TEXT });
  }

  private async saveAddText(ctx: any, text: string) {
    const session = await getSession(this.prisma, this.uid(ctx));
    const draft = { ...(session?.draft ?? {}), text: text.trim() };
    await setSession(this.prisma, this.uid(ctx), { step: 'awaiting_age', draft });
    await ctx.reply('Укажите возраст (число) или нажмите «Пропустить».', { reply_markup: menus.skipKeyboard('add:skip_age') });
  }

  private async saveAddAge(ctx: any, session: SessionData, text: string) {
    const value = parseInt(text.trim(), 10);
    if (Number.isNaN(value) || value < 18 || value > 99) {
      await ctx.reply('Пожалуйста, пришлите число от 18 до 99 или нажмите «Пропустить».', { reply_markup: menus.skipKeyboard('add:skip_age') });
      return;
    }
    const draft = { ...(session.draft ?? {}), age: value };
    await setSession(this.prisma, this.uid(ctx), { step: 'awaiting_city', draft });
    await ctx.reply('Укажите город или нажмите «Пропустить».', { reply_markup: menus.skipKeyboard('add:skip_city') });
  }

  private async saveAddCity(ctx: any, session: SessionData, text: string) {
    const draft = { ...(session.draft ?? {}), city: text.trim() || undefined };
    await setSession(this.prisma, this.uid(ctx), { step: 'idle', draft });
    await this.showAddPreview(ctx, draft);
  }

  private async skipAge(ctx: any) {
    const session = await getSession(this.prisma, this.uid(ctx));
    const draft = { ...(session?.draft ?? {}), age: undefined };
    await setSession(this.prisma, this.uid(ctx), { step: 'awaiting_city', draft });
    await ctx.reply('Укажите город или нажмите «Пропустить».', { reply_markup: menus.skipKeyboard('add:skip_city') });
  }

  private async skipCity(ctx: any) {
    const session = await getSession(this.prisma, this.uid(ctx));
    const draft = { ...(session?.draft ?? {}), city: undefined };
    await setSession(this.prisma, this.uid(ctx), { step: 'idle', draft });
    await this.showAddPreview(ctx, draft);
  }

  private async showAddPreview(ctx: any, draft: DraftData) {
    const items = draft.media ?? [];
    const first = items[0];
    const caption = `Предпросмотр${items.length > 1 ? ` (${items.length} файлов)` : ''}\n\n${draft.title ?? ''}\n\n${draft.text || '—'}`;
    const media = await this.storage.download(first?.mediaKey ?? '');
    if (first?.type === 'PHOTO') {
      await ctx.replyWithPhoto({ source: media }, { caption, reply_markup: menus.ADD_PREVIEW });
    } else {
      await ctx.replyWithVideo({ source: media }, { caption, reply_markup: menus.ADD_PREVIEW });
    }
  }

  private async commitAdd(ctx: any, status: 'PUBLISHED' | 'DRAFT') {
    const session = await getSession(this.prisma, this.uid(ctx));
    const draft = session?.draft;
    if (!draft?.media?.length || !draft.title) {
      await this.answerCb(ctx, 'Не хватает данных');
      return this.showMainMenu(ctx);
    }
    const card = await this.cardsService.create({
      title: draft.title,
      text: draft.text ?? '',
      media: (draft.media ?? []).map((m) => ({ type: m.type, mediaKey: m.mediaKey })),
      authorUserId: this.uid(ctx),
      status,
      age: draft.age,
      city: draft.city,
    });
    await resetSession(this.prisma, this.uid(ctx));
    const label = status === 'PUBLISHED' ? '✅ Опубликовано' : '💾 Сохранено в черновик';
    await this.answerCb(ctx, label);
    await this.showCard(ctx, card.id, true, label);
  }

  private async editAddTitle(ctx: any) {
    const session = await getSession(this.prisma, this.uid(ctx));
    await setSession(this.prisma, this.uid(ctx), { step: 'awaiting_add_title', draft: session?.draft });
    await ctx.reply('Пришлите новый заголовок:');
  }

  private async editAddText(ctx: any) {
    const session = await getSession(this.prisma, this.uid(ctx));
    await setSession(this.prisma, this.uid(ctx), { step: 'awaiting_add_text', draft: session?.draft });
    await ctx.reply('Пришлите новое описание:');
  }

  private async saveAddTitleEdit(ctx: any, session: SessionData, title: string) {
    if (title.trim().length > 200) {
      await ctx.reply('❌ Заголовок слишком длинный (максимум 200 символов).');
      return;
    }
    const draft = { ...(session.draft ?? {}), title: title.trim() };
    await setSession(this.prisma, this.uid(ctx), { step: 'idle', draft });
    await this.showAddPreview(ctx, draft);
  }

  private async saveAddTextEdit(ctx: any, session: SessionData, text: string) {
    const draft = { ...(session.draft ?? {}), text: text.trim() };
    await setSession(this.prisma, this.uid(ctx), { step: 'idle', draft });
    await this.showAddPreview(ctx, draft);
  }

  // (метод replaceAdd удалён — вместо замены теперь «добавить медиа»)

  private async cancelAdd(ctx: any) {
    await resetSession(this.prisma, this.uid(ctx));
    await this.answerCb(ctx, 'Отменено');
    await this.showMainMenu(ctx);
  }
  private async setCardStatus(ctx: any, id: string, status: 'PUBLISHED' | 'DRAFT' | 'REMOVED') {
    await this.prisma.card.updateMany({ where: { id }, data: { status } });
    await this.answerCb(ctx);
    await this.showCard(ctx, id, true);
  }

  private async askDelete(ctx: any, id: string) {
    await ctx.editMessageCaption('🗑 Точно удалить карточку?', { reply_markup: menus.confirm('confirm:delete', id, 'удалить') });
  }

  private async askPurge(ctx: any, id: string) {
    await ctx.editMessageCaption('⚠️ Удалить навсегда? Это действие нельзя отменить.', { reply_markup: menus.confirm('confirm:purge', id, 'удалить навсегда') });
  }

  private async confirmDelete(ctx: any, id: string) {
    await this.prisma.card.updateMany({ where: { id }, data: { status: 'REMOVED' } });
    await this.answerCb(ctx, 'Удалено');
    await this.showCard(ctx, id, true, '🗑 Удалена');
  }

  private async confirmPurge(ctx: any, id: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: { media: true },
    });
    if (card) {
      for (const m of card.media) {
        await this.storage.delete(m.mediaKey).catch(() => undefined);
      }
      await this.prisma.card.delete({ where: { id } });
    }
    await this.answerCb(ctx, 'Удалено навсегда');
    await this.render(ctx, '🗑 Карточка удалена навсегда.', menus.BACK_TO_MENU);
  }

  private async editCardTitle(ctx: any, id: string) {
    await setSession(this.prisma, this.uid(ctx), { step: 'awaiting_edit_title', editingCardId: id });
    await ctx.reply('Пришлите новый заголовок:');
  }

  private async editCardText(ctx: any, id: string) {
    await setSession(this.prisma, this.uid(ctx), { step: 'awaiting_edit_text', editingCardId: id });
    await ctx.reply('Пришлите новое описание:');
  }

  private async appendCardMedia(ctx: any, id: string) {
    await setSession(this.prisma, this.uid(ctx), { step: 'awaiting_append_media', editingCardId: id });
    await ctx.reply('Пришлите фото или видео для добавления.');
  }

  private async saveCardTitle(ctx: any, session: SessionData, title: string) {
    if (title.trim().length > 200) {
      await ctx.reply('❌ Заголовок слишком длинный (максимум 200 символов).');
      return;
    }
    const id = session.editingCardId;
    if (id) {
      await this.prisma.card.updateMany({ where: { id }, data: { title: title.trim() } });
      await resetSession(this.prisma, this.uid(ctx));
      await ctx.reply('✅ Заголовок обновлён.');
      await this.showCard(ctx, id, false);
    }
  }

  private async saveCardText(ctx: any, session: SessionData, text: string) {
    const id = session.editingCardId;
    if (id) {
      await this.prisma.card.updateMany({ where: { id }, data: { text: text.trim() } });
      await resetSession(this.prisma, this.uid(ctx));
      await ctx.reply('✅ Описание обновлено.');
      await this.showCard(ctx, id, false);
    }
  }

  private async appendMediaToCard(ctx: any, session: SessionData, type: 'PHOTO' | 'VIDEO', fileId: string) {
    const id = session.editingCardId;
    if (!id) return this.showMainMenu(ctx);
    try {
      const buffer = await this.downloadMedia(ctx, fileId);
      const media = type === 'VIDEO'
        ? await this.mediaService.processVideo(buffer)
        : await this.mediaService.processImage(buffer);
      const last = await this.prisma.media.findFirst({
        where: { cardId: id },
        orderBy: { sort: 'desc' },
        select: { sort: true },
      });
      await this.prisma.media.create({
        data: { cardId: id, type, mediaKey: media.key, sort: (last?.sort ?? -1) + 1 },
      });
      await resetSession(this.prisma, this.uid(ctx));
      await ctx.reply('✅ Медиа добавлено.');
      await this.showCard(ctx, id, false);
    } catch (e) {
      this.logger.error('appendMediaToCard', e as Error);
      await ctx.reply('❌ Не удалось обработать файл.');
    }
  }
}
