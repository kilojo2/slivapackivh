'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Лента' },
  { href: '/new', label: 'New' },
  { href: '/onlyfans', label: 'OnlyFans' },
  { href: '/tiktok', label: 'TikTok' },
  { href: '/popular', label: 'Популярное' },
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