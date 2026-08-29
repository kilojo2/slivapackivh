import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Контакты — SlivaPack',
};

export default function ContactsPage() {
  return (
    <article className="prose">
      <h1>Контакты</h1>
      <p>
        Связаться с нами можно в Telegram:{' '}
        <a
          href="https://t.me/heroinstead"
          target="_blank"
          rel="noopener noreferrer"
        >
          @heroinstead
        </a>
      </p>
      <p>Для запросов на удаление контента используйте этот же контакт.</p>
    </article>
  );
}
