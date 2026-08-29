'use client';

import { useState } from 'react';
import { likeCard } from '../lib/api';

interface LikeButtonProps {
  cardId: string;
  likeCount: number;
  onLiked: (count: number) => void;
}

export function LikeButton({ cardId, likeCount, onLiked }: LikeButtonProps) {
  const [busy, setBusy] = useState(false);
  const [liked, setLiked] = useState(false);

  async function handleLike() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await likeCard(cardId);
      setLiked(res.liked);
      onLiked(res.likeCount);
    } catch {
      // rate limit или сеть — молча игнорируем
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-like ${liked ? 'is-liked' : ''}`}
      onClick={handleLike}
      disabled={busy}
      aria-label="Лайкнуть"
    >
      ♥ {likeCount}
    </button>
  );
}
