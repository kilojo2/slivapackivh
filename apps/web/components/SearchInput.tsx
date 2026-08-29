'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function SearchInput({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQ);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form className="search-form" onSubmit={onSubmit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Поиск по заголовку или описанию…"
      />
      <button type="submit" className="btn btn-primary">
        Найти
      </button>
    </form>
  );
}