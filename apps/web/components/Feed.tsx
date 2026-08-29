'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchCards } from '../lib/api';
import type { Card } from '../lib/types';
import { CardItem } from './CardItem';
import { Modal } from './Modal';

interface FeedProps {
  title?: string;
  sort?: 'latest' | 'popular';
  q?: string;
}

export function Feed({ title = 'Лента', sort, q }: FeedProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Card | null>(null);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const load = useCallback(async (nextOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCards(nextOffset, 24, { sort, q });
      setCards((prev) =>
        nextOffset === 0 ? data.items : [...prev, ...data.items],
      );
      setTotal(data.total);
      setOffset(nextOffset + data.items.length);
    } catch {
      setError('Не удалось загрузить карточки. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, [sort, q]);

  useEffect(() => {
    void load(0);
  }, [load]);

  function handleLiked(cardId: string) {
    return (count: number) =>
      setLikeCounts((prev) => ({ ...prev, [cardId]: count }));
  }

  return (
    <>
      <h1>{title}</h1>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            likeCount={likeCounts[card.id] ?? card.likeCount}
            onView={setSelected}
            onLiked={handleLiked(card.id)}
          />
        ))}
      </div>

      {loading && <p className="muted">Загрузка…</p>}

      {!loading && offset < total && (
        <button className="btn load-more" onClick={() => void load(offset)}>
          Показать ещё
        </button>
      )}

      {!loading && cards.length === 0 && (
        <p className="muted">Ничего не найдено.</p>
      )}

      {selected && (
        <Modal
          card={selected}
          likeCount={likeCounts[selected.id] ?? selected.likeCount}
          onClose={() => setSelected(null)}
          onLiked={handleLiked(selected.id)}
        />
      )}
    </>
  );
}