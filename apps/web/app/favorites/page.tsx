'use client';

import { useCallback, useEffect, useState } from 'react';
import { CardItem } from '../../components/CardItem';
import { Modal } from '../../components/Modal';
import { getFavorites } from '../../lib/favorites';
import type { Card } from '../../lib/types';

export default function FavoritesPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card | null>(null);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const refresh = useCallback(() => {
    setCards(getFavorites());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleLiked(cardId: string) {
    return (count: number) =>
      setLikeCounts((prev) => ({ ...prev, [cardId]: count }));
  }

  return (
    <>
      <h1>Избранное</h1>
      {cards.length === 0 ? (
        <p className="muted">
          Пока пусто. Нажмите ☆ на карточке, чтобы добавить её сюда.
        </p>
      ) : (
        <div className="grid">
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              likeCount={likeCounts[card.id] ?? card.likeCount}
              onView={setSelected}
              onLiked={handleLiked(card.id)}
              onFavoritesChanged={refresh}
            />
          ))}
        </div>
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