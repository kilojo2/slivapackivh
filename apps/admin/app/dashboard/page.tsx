'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { AdminShell } from '../../components/AdminShell';

interface Stats {
  today: number;
  total: number;
  days: { date: string; count: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  return (
    <AdminShell>
      <h1>Дашборд</h1>
      {stats ? (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <strong>{stats.today}</strong>
              <span>Сегодня</span>
            </div>
            <div className="stat-card">
              <strong>{stats.total}</strong>
              <span>Всего</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Посещения</th>
              </tr>
            </thead>
            <tbody>
              {stats.days.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>Загрузка…</p>
      )}
    </AdminShell>
  );
}