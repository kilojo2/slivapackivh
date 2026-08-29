'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchCards, fetchCities, type FetchCardsOptions } from '../lib/api';
import type { Card } from '../lib/types';
import { CardItem } from './CardItem';
import { Modal } from './Modal';

interface FeedProps {
  title?: string;
  sort?: 'latest' | 'popular';
  q?: string;
  showFilters?: boolean;
}

const AGE_OPTIONS = [
  { label: 'Любой возраст', value: '' },
  { label: '18–21', value: '18-21' },
  { label: '22–25', value: '22-25' },
  { label: '26+', value: '26-' },
];

export function Feed({ title = 'Лента', sort, q, showFilters = false }: FeedProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Card | null>(null);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'new' | 'popular'>('all');
  const [type, setType] = useState<'all' | 'photo' | 'video'>('all');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (showFilters) {
      fetchCities().then(setCities).catch(() => setCities([]));
    }
  }, [showFilters]);

  const buildOptions = useCallback((): FetchCardsOptions => {
    const options: FetchCardsOptions = {};
    options.sort = showFilters
      ? tab === 'popular'
        ? 'popular'
        : 'latest'
      : (sort ?? 'latest');
    if (showFilters && tab === 'new') options.days = 7;
    const qq = (q ?? '').trim() || search.trim();
    if (qq) options.q = qq;
    if (type !== 'all') options.type = type;
    if (age === '18-21') {
      options.ageMin = 18;
      options.ageMax = 21;
    } else if (age === '22-25') {
      options.ageMin = 22;
      options.ageMax = 25;
    } else if (age === '26-') {
      options.ageMin = 26;
    }
    if (city) options.city = city;
    return options;
  }, [showFilters, tab, sort, q, search, type, age, city]);

  const load = useCallback(
    async (nextOffset: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCards(nextOffset, 24, buildOptions());
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
    },
    [buildOptions],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  function handleLiked(cardId: string) {
    return (count: number) =>
      setLikeCounts((prev) => ({ ...prev, [cardId]: count }));
  }

  function applySearch() {
    setSearch(searchInput.trim());
  }

  return (
    <>
      <h1>{title}</h1>

      {showFilters && (
        <div className="filters">
          <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
          >
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="🔎 Поиск…"
            />
            <button type="submit" className="btn btn-primary">
              Найти
            </button>
          </form>

          <div className="filter-tabs">
            <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
              Все
            </button>
            <button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>
              Новые
            </button>
            <button className={tab === 'popular' ? 'active' : ''} onClick={() => setTab('popular')}>
              Популярные
            </button>
          </div>

          <div className="filter-row">
            <select value={type} onChange={(e) => setType(e.target.value as 'all' | 'photo' | 'video')}>
              <option value="all">Тип: любой</option>
              <option value="photo">Фото</option>
              <option value="video">Видео</option>
            </select>
            <select value={age} onChange={(e) => setAge(e.target.value)}>
              {AGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Город: любой</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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