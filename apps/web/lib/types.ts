export type CardType = 'PHOTO' | 'VIDEO';

export interface MediaItem {
  type: CardType;
  mediaKey: string;
}

export interface Card {
  id: string;
  title: string;
  text: string;
  age?: number;
  city?: string;
  source?: string;
  media: MediaItem[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

export interface CardsResponse {
  items: Card[];
  total: number;
  limit: number;
  offset: number;
}