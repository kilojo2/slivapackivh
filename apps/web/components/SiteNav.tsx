'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Лента' },
  { href: '/popular', label: 'Популярное' },
  { href: '/new', label: 'Новинки' },
  { href: '/favorites', label: 'Избранное' },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav className="site-nav">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname === item.href ? 'active' : ''}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}