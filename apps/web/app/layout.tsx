import type { Metadata } from 'next';
import Link from 'next/link';
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
          <nav>
            <Link href="/privacy">Политика конфиденциальности</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <p>
            Контакты:{' '}
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
