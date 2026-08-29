import Link from 'next/link';

export default function ProfilePage() {
  return (
    <article className="prose">
      <h1>Профиль</h1>
      <p>Личный кабинет пока в разработке.</p>
      <p>
        По вопросам — <Link href="/contacts">Контакты</Link>.
      </p>
    </article>
  );
}