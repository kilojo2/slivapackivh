import type { Card } from './types';

const KEY = 'slivapack_favorites';

export function getFavorites(): Card[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Card[]) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((c) => c.id === id);
}

export function toggleFavorite(card: Card): Card[] {
  const list = getFavorites();
  const next = list.some((c) => c.id === card.id)
    ? list.filter((c) => c.id !== card.id)
    : [card, ...list];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}