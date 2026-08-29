'use client';

import { mediaUrl } from '../lib/api';
import type { Card } from '../lib/types';
import { LikeButton } from './LikeButton';

interface CardItemProps {
  card: Card;
  likeCount: number;
  onView: (card: Card) => void;
  onLiked: (count: number) => void;
}

export function CardItem({
  card,
  likeCount,
  onView,
  onLiked,
}: CardItemProps) {
  const first = card.media[0];
  const url = first ? mediaUrl(first.mediaKey) : '';

  return (
    <article className="card">
      <button
        type="button"
        className="card-media"
        onClick={() => onView(card)}
        aria-label={`Открыть: ${card.title}`}
      >
        {first?.type === 'VIDEO' ? (
          <video src={url} preload="metadata" muted playsInline />
        ) : (
          <img src={url} alt={card.title} loading="lazy" />
        )}

        <span className="media-scrim" />

        <span className="badge badge-type">
          {first?.type === 'VIDEO' ? '▶ видео' : 'фото'}
        </span>

        {card.media.length > 1 && (
          <span className="badge badge-count">📷 {card.media.length}</span>
        )}

        <span className="badge badge-views">👁 {card.viewCount}</span>

        <span className="media-cta">Смотреть</span>
      </button>

      <div className="card-body">
        <h2 className="card-title">{card.title}</h2>
        <p className="card-text">{card.text}</p>
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onView(card)}
          >
            Смотреть
          </button>
          <LikeButton cardId={card.id} likeCount={likeCount} onLiked={onLiked} />
        </div>
      </div>
    </article>
  );
}