import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { SiteHeader } from '../components/SiteHeader';
import { VisitTracker } from '../components/VisitTracker';
import './globals.css';

export const metadata: Metadata = {
  title: 'SlivaPack',
  description: 'Платформа публикации фото и видео',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <SiteHeader />
        <VisitTracker />
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