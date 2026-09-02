'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Flame,
  Heart,
  Home,
  Music2,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Лента', icon: Home },
  { href: '/new', label: 'New', icon: Sparkles },
  { href: '/onlyfans', label: 'OnlyFans', icon: Heart },
  { href: '/tiktok', label: 'TikTok', icon: Music2 },
  { href: '/popular', label: 'Популярное', icon: Flame },
  { href: '/favorites', label: 'Избранное', icon: Star },
];

export function SiteNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });

  useEffect(() => {
    const update = () => {
      const nav = navRef.current;
      if (!nav) return;
      const activeEl = nav.querySelector<HTMLElement>('a.active');
      if (!activeEl) {
        setPill((p) => ({ ...p, visible: false }));
        return;
      }
      setPill({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        visible: true,
      });
    };

    update();

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && navRef.current) {
      ro = new ResizeObserver(update);
      ro.observe(navRef.current);
    }
    window.addEventListener('resize', update);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [pathname]);

  return (
    <nav ref={navRef} className="site-nav">
      <span
        className="nav-pill"
        style={{
          transform: `translateX(${pill.left}px)`,
          width: `${pill.width}px`,
          opacity: pill.visible ? 1 : 0,
        }}
        aria-hidden
      />
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={active ? 'nav-link active' : 'nav-link'}
          >
            <Icon className="nav-icon" size={19} strokeWidth={2} aria-hidden />
            <span className="nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}