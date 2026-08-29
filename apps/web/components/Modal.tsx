'use client';

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
  const url = mediaUrl(card);

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
        {card.type === 'VIDEO' ? (
          <video src={url} controls autoPlay className="modal-media" />
        ) : (
          <img src={url} alt={card.title} className="modal-media" />
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
