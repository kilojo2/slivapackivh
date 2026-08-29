import type { CardsResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface FetchCardsOptions {
  sort?: 'latest' | 'popular';
  q?: string;
}

export async function fetchCards(
  offset = 0,
  limit = 24,
  options: FetchCardsOptions = {},
): Promise<CardsResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  if (options.sort) params.set('sort', options.sort);
  if (options.q) params.set('q', options.q);
  const res = await fetch(`${API_URL}/cards?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cards: ${res.status}`);
  }
  return res.json();
}

export async function likeCard(
  id: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`${API_URL}/cards/${id}/like`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to like: ${res.status}`);
  }
  return res.json();
}

export function mediaUrl(mediaKey: string): string {
  const base = process.env.NEXT_PUBLIC_MEDIA_URL ?? '';
  return `${base}/${mediaKey}`;
}