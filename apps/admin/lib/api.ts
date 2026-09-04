const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('admin_token');
}

export function setToken(token: string) {
  sessionStorage.setItem('admin_token', token);
}

export function clearToken() {
  sessionStorage.removeItem('admin_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      clearToken();
      window.location.href = '/login';
    }
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (password: string) =>
    request<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  stats: () => request<any>('/admin/stats'),
  cards: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/admin/cards${qs ? `?${qs}` : ''}`);
  },
  updateCard: (id: string, data: Record<string, unknown>) =>
    request(`/admin/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCard: (id: string, hard = false) =>
    request(`/admin/cards/${id}?hard=${hard}`, { method: 'DELETE' }),
  users: () => request<any[]>('/admin/users'),
  addUser: (data: {
    telegramUserId: string;
    isActive: boolean;
    role?: 'admin' | 'editor';
  }) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  removeUser: (id: string) => request(`/admin/users/${id}`, { method: 'DELETE' }),
};