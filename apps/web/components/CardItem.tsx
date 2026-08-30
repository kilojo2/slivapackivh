'use client';

import { useState } from 'react';
import { mediaUrl } from '../lib/api';
import { isFavorite, toggleFavorite } from '../lib/favorites';
import type { Card } from '../lib/types';
import { LikeButton } from './LikeButton';

interface CardItemProps {
  card: Card;
  likeCount: number;
  onView: (card: Card) => void;
  onLiked: (count: number) => void;
  onFavoritesChanged?: () => void;
}

export function CardItem({
  card,
  likeCount,
  onView,
  onLiked,
  onFavoritesChanged,
}: CardItemProps) {
  const first = card.media[0];
  const url = first ? mediaUrl(first.mediaKey) : '';
  const [fav, setFav] = useState(() => isFavorite(card.id));

  function toggleFav() {
    toggleFavorite(card);
    setFav(!fav);
    onFavoritesChanged?.();
  }

  return (
    <article className="card">
      <button
        type="button"
        className="card-media"
        onClick={() => onView(card)}
        aria-label={`Открыть: ${card.title}`}
      >
        {first?.type === 'VIDEO' ? (
          <video src={url} preload="none" muted playsInline />
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
        {card.city && <p className="card-subtitle">{card.city}</p>}
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
          <button
            type="button"
            className={`btn btn-bookmark ${fav ? 'is-active' : ''}`}
            onClick={toggleFav}
            aria-label="В избранное"
            title={fav ? 'Убрать из избранного' : 'В избранное'}
          >
            {fav ? '★' : '☆'}
          </button>
        </div>
      </div>
    </article>
  );
}