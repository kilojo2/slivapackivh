import { Feed } from '../../components/Feed';
import { SearchInput } from '../../components/SearchInput';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <>
      <SearchInput initialQ={q ?? ''} />
      <Feed title={q ? `Результаты: ${q}` : 'Поиск'} q={q ?? ''} />
    </>
  );
}