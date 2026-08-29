import { Markup } from 'telegraf';

export const MAIN_MENU = Markup.inlineKeyboard([
  [Markup.button.callback('➕ Добавить фото/видео', 'menu:add')],
  [Markup.button.callback('📋 Мои карточки', 'menu:list')],
  [Markup.button.callback('📊 Статистика', 'menu:stats')],
  [Markup.button.callback('❓ Помощь', 'menu:help')],
]).reply_markup;

export const BACK_TO_MENU = Markup.inlineKeyboard([
  [Markup.button.callback('🏠 В меню', 'menu')],
]).reply_markup;

export const MEDIA_MORE = Markup.inlineKeyboard([
  [Markup.button.callback('✅ Готово', 'add:media_done')],
  [Markup.button.callback('❌ Отмена', 'menu')],
]).reply_markup;

export const SKIP_TEXT = Markup.inlineKeyboard([
  [Markup.button.callback('⏭ Пропустить', 'add:skip_text')],
  [Markup.button.callback('❌ Отмена', 'menu')],
]).reply_markup;

export const ADD_PREVIEW = Markup.inlineKeyboard([
  [
    Markup.button.callback('✅ Опубликовать', 'add:publish'),
    Markup.button.callback('💾 В черновик', 'add:save_draft'),
  ],
  [
    Markup.button.callback('✏️ Заголовок', 'add:edit_title'),
    Markup.button.callback('✏️ Описание', 'add:edit_text'),
  ],
  [Markup.button.callback('➕ Добавить ещё медиа', 'add:more_media')],
  [Markup.button.callback('❌ Отмена', 'add:cancel')],
]).reply_markup;

export function listFilters(published: number, drafts: number, removed: number) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🟢 Опубликованные (${published})`, 'list:published')],
    [Markup.button.callback(`🟡 Черновики (${drafts})`, 'list:drafts')],
    [Markup.button.callback(`🔴 Удалённые (${removed})`, 'list:removed')],
    [Markup.button.callback('🏠 В меню', 'menu')],
  ]).reply_markup;
}

export function cardList(cards: { id: string; title: string }[]) {
  const rows: any[][] = cards.map((c) => [
    Markup.button.callback(c.title || 'Без названия', `card:${c.id}`),
  ]);
  rows.push([Markup.button.callback('🔙 Назад', 'menu:list')]);
  return Markup.inlineKeyboard(rows).reply_markup;
}

export function cardActions(card: { id: string; status: string }) {
  const rows: any[][] = [];
  if (card.status === 'DRAFT') {
    rows.push([Markup.button.callback('✅ Опубликовать', `card:publish:${card.id}`)]);
  }
  if (card.status === 'PUBLISHED') {
    rows.push([Markup.button.callback('⏸ Снять с публикации', `card:unpublish:${card.id}`)]);
  }
  if (card.status === 'REMOVED') {
    rows.push([Markup.button.callback('♻️ Восстановить', `card:restore:${card.id}`)]);
  }
  rows.push([
    Markup.button.callback('✏️ Заголовок', `card:edit_title:${card.id}`),
    Markup.button.callback('✏️ Описание', `card:edit_text:${card.id}`),
  ]);
  rows.push([Markup.button.callback('➕ Добавить медиа', `card:append:${card.id}`)]);
  rows.push([
    card.status === 'REMOVED'
      ? Markup.button.callback('🗑 Удалить навсегда', `card:purge:${card.id}`)
      : Markup.button.callback('🗑 Удалить', `card:delete:${card.id}`),
  ]);
  rows.push([Markup.button.callback('🔙 Назад', 'menu:list')]);
  return Markup.inlineKeyboard(rows).reply_markup;
}

export function confirm(action: string, id: string, label: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`✅ Да, ${label}`, `${action}:${id}`)],
    [Markup.button.callback('❌ Нет', `card:edit:${id}`)],
  ]).reply_markup;
}
