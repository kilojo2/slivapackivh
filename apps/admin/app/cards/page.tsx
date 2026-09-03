'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { AdminShell } from '../../components/AdminShell';

interface CardRow {
  id: string;
  title: string;
  text: string;
  source: string | null;
  status: string;
  viewCount: number;
  likeCount: number;
}

export default function CardsPage() {
  const [data, setData] = useState<{ items: CardRow[]; total: number }>({
    items: [],
    total: 0,
  });
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<CardRow | null>(null);
  const [form, setForm] = useState({ title: '', text: '', source: '', status: 'PUBLISHED' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (source) params.source = source;
    if (q) params.q = q;
    api.cards(params).then(setData).catch(() => {});
  }, [status, source, q]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (c: CardRow) => {
    setEditing(c);
    setForm({ title: c.title, text: c.text, source: c.source ?? '', status: c.status });
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await api.updateCard(editing.id, {
        title: form.title,
        text: form.text,
        source: form.source || null,
        status: form.status,
      });
      setEditing(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string, hard: boolean) => {
    if (!confirm(hard ? 'Удалить навсегда (с медиа)?' : 'Снять (перевести в REMOVED)?')) return;
    await api.deleteCard(id, hard);
    load();
  };

  return (
    <AdminShell>
      <h1>Карточки</h1>

      <div className="filters">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск…"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Статус: любой</option>
          <option value="PUBLISHED">Опубликовано</option>
          <option value="DRAFT">Черновик</option>
          <option value="REMOVED">Удалено</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Источник: любой</option>
          <option value="onlyfans">OnlyFans</option>
          <option value="tiktok">TikTok</option>
        </select>
      </div>

      {editing && (
        <div className="editor">
          <h2>Редактировать</h2>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Заголовок"
          />
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            placeholder="Описание"
          />
          <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            <option value="">Без источника</option>
            <option value="onlyfans">OnlyFans</option>
            <option value="tiktok">TikTok</option>
          </select>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="PUBLISHED">Опубликовано</option>
            <option value="DRAFT">Черновик</option>
            <option value="REMOVED">Удалено</option>
          </select>
          <button onClick={save} disabled={busy}>
            Сохранить
          </button>
          <button className="secondary" onClick={() => setEditing(null)}>
            Отмена
          </button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Заголовок</th>
            <th>Статус</th>
            <th>Источник</th>
            <th>Просмотры</th>
            <th>Лайки</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((c) => (
            <tr key={c.id}>
              <td>{c.title}</td>
              <td>{c.status}</td>
              <td>{c.source ?? '—'}</td>
              <td>{c.viewCount}</td>
              <td>{c.likeCount}</td>
              <td>
                <button className="secondary" onClick={() => startEdit(c)}>
                  Изменить
                </button>{' '}
                <button className="secondary" onClick={() => del(c.id, false)}>
                  Снять
                </button>{' '}
                <button className="danger" onClick={() => del(c.id, true)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Всего: {data.total}</p>
    </AdminShell>
  );
}