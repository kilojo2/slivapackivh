export type CardType = 'PHOTO' | 'VIDEO';

export interface Card {
  id: string;
  type: CardType;
  title: string;
  text: string;
  mediaKey: string;
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
