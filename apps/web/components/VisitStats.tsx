'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface Stats {
  today: number;
  total: number;
  days: { date: string; count: number }[];
}

export function VisitStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((data: Stats) => setStats(data))
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!stats) return <p>Загрузка статистики…</p>;

  const last7 = stats.days.slice(0, 7);

  return (
    <section>
      <h2>Статистика посещений</h2>
      <p>
        Сегодня: <strong>{stats.today}</strong> · Всего:{' '}
        <strong>{stats.total}</strong>
      </p>
      <ul>
        {last7.map((d) => (
          <li key={d.date}>
            {d.date} — {d.count}
          </li>
        ))}
      </ul>
    </section>
  );
}