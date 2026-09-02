'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Search, User } from 'lucide-react';
import { SiteNav } from './SiteNav';
import { Logo } from './brand/Logo';

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <>
      <header
        ref={ref}
        className={scrolled ? 'site-header scrolled' : 'site-header'}
        onMouseMove={onMouseMove}
      >
        <Logo />

        <SiteNav />

        <div className="site-actions">
          <Link
            href="/search"
            className={pathname === '/search' ? 'nav-action active' : 'nav-action'}
            aria-label="Поиск"
          >
            <Search size={20} strokeWidth={2} aria-hidden />
          </Link>
          <Link
            href="/profile"
            className={
              pathname === '/profile'
                ? 'nav-action nav-action--profile active'
                : 'nav-action nav-action--profile'
            }
            aria-label="Профиль"
          >
            <User size={19} strokeWidth={2} aria-hidden />
            <span className="nav-label">Профиль</span>
          </Link>
        </div>
      </header>

      <div className="site-bottom-nav" aria-label="Навигация">
        <SiteNav />
      </div>
    </>
  );
}