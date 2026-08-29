import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '../components/SiteNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'SlivaPack',
  description: 'Платформа публикации фото и видео',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <Link href="/" className="logo">
            SlivaPack
          </Link>
          <SiteNav />
          <div className="site-actions">
            <Link href="/search" className="icon-btn" aria-label="Поиск">
              🔍
            </Link>
            <Link href="/favorites" className="icon-btn" aria-label="Избранное">
              ♡
            </Link>
            <Link href="/profile" className="profile-link">
              Профиль
            </Link>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <p>
            <Link href="/privacy">Политика конфиденциальности</Link>
            {' · '}
            <Link href="/contacts">Контакты</Link>
            {' · '}
            <a
              href="https://t.me/heroinstead"
              target="_blank"
              rel="noopener noreferrer"
            >
              @heroinstead
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}