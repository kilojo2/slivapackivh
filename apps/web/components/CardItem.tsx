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
  const url = mediaUrl(card);

  return (
    <article className="card">
      <button
        type="button"
        className="card-media"
        onClick={() => onView(card)}
        aria-label={`Открыть: ${card.title}`}
      >
        {card.type === 'VIDEO' ? (
          <>
            <video src={url} preload="metadata" muted playsInline />
            <span className="badge">▶ видео</span>
          </>
        ) : (
          <img src={url} alt={card.title} loading="lazy" />
        )}
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
            Посмотреть
          </button>
          <LikeButton cardId={card.id} likeCount={likeCount} onLiked={onLiked} />
        </div>
      </div>
    </article>
  );
}
