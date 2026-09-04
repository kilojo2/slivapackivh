'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { AdminShell } from '../../components/AdminShell';

interface UserRow {
  id: string;
  telegramUserId: string;
  role: string;
  isActive: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [telegramUserId, setTelegramUserId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [role, setRole] = useState<'admin' | 'editor'>('editor');

  const load = useCallback(() => {
    api.users().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!telegramUserId.trim()) return;
    await api.addUser({ telegramUserId: telegramUserId.trim(), isActive, role });
    setTelegramUserId('');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить пользователя из allowlist?')) return;
    await api.removeUser(id);
    load();
  };

  return (
    <AdminShell>
      <h1>Пользователи (allowlist)</h1>
      <div className="filters">
        <input
          value={telegramUserId}
          onChange={(e) => setTelegramUserId(e.target.value)}
          placeholder="Telegram user id"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'editor')}
        >
          <option value="editor">editor</option>
          <option value="admin">admin</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />{' '}
          Активен
        </label>
        <button onClick={add}>Добавить</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Telegram ID</th>
            <th>Роль</th>
            <th>Активен</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.telegramUserId}</td>
              <td>{u.role}</td>
              <td>{u.isActive ? 'да' : 'нет'}</td>
              <td>
                <button className="danger" onClick={() => remove(u.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}