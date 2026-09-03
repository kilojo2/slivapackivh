'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '../lib/api';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    clearToken();
    router.replace('/login');
  };

  const links = [
    { href: '/dashboard', label: 'Дашборд' },
    { href: '/cards', label: 'Карточки' },
    { href: '/users', label: 'Пользователи' },
  ];

  return (
    <div className="admin">
      <aside className="sidebar">
        <div className="brand">SlivaPack</div>
        <nav>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? 'active' : ''}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button className="logout" onClick={logout}>
          Выйти
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}