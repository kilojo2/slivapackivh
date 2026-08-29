'use client';

import { useState } from 'react';
import { mediaUrl } from '../lib/api';
import type { Card } from '../lib/types';
import { LikeButton } from './LikeButton';

interface ModalProps {
  card: Card;
  likeCount: number;
  onClose: () => void;
  onLiked: (count: number) => void;
}

export function Modal({ card, likeCount, onClose, onLiked }: ModalProps) {
  const [index, setIndex] = useState(0);
  const total = card.media.length;
  const current = card.media[index];

  function prev() {
    setIndex((i) => (i - 1 + total) % total);
  }
  function next() {
    setIndex((i) => (i + 1) % total);
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        {current?.type === 'VIDEO' ? (
          <video
            key={current.mediaKey}
            src={mediaUrl(current.mediaKey)}
            controls
            autoPlay
            className="modal-media"
          />
        ) : (
          <img
            key={current.mediaKey}
            src={mediaUrl(current.mediaKey)}
            alt={card.title}
            className="modal-media"
          />
        )}

        {total > 1 && (
          <div className="gallery-nav">
            <button type="button" onClick={prev} aria-label="Назад">
              ‹
            </button>
            <span className="muted">
              {index + 1} / {total}
            </span>
            <button type="button" onClick={next} aria-label="Вперёд">
              ›
            </button>
          </div>
        )}

        <div className="modal-body">
          <h2>{card.title}</h2>
          <p>{card.text}</p>
          <div className="modal-actions">
            <LikeButton cardId={card.id} likeCount={likeCount} onLiked={onLiked} />
            <span className="muted">Просмотров: {card.viewCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
