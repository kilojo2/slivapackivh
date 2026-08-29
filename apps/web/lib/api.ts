import type { CardsResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function fetchCards(
  offset = 0,
  limit = 24,
): Promise<CardsResponse> {
  const res = await fetch(`${API_URL}/cards?limit=${limit}&offset=${offset}`);
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
