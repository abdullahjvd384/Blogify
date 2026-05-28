import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Hash, Users } from 'lucide-react';
import { useSearch } from '@/features/search/hooks';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { ArticleCard } from '@/components/ArticleCard';
import { Avatar } from '@/components/Avatar';
import { Input } from '@/components/ui/Input';
import { profilePath } from '@/lib/profile';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get('q') || '');
  const debounced = useDebouncedValue(term, 350);

  useEffect(() => {
    setParams(debounced ? { q: debounced } : {}, { replace: true });
  }, [debounced, setParams]);

  const { data, isFetching } = useSearch(debounced, { limit: 12 });
  const people = data?.people || [];
  const tags = data?.tags || [];
  const articles = data?.articles || [];
  const hasResults = people.length || tags.length || articles.length;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
        Search
      </h1>
      <div className="mt-5 max-w-xl">
        <Input
          autoFocus
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search stories, people, topics…"
          leftIcon={<Search />}
        />
      </div>

      {!debounced && (
        <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
          Start typing to search across stories, writers, and topics.
        </p>
      )}

      {debounced && !isFetching && !hasResults && (
        <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
          No results for “{debounced}”.
        </p>
      )}

      {debounced && (
        <div className="mt-10 space-y-12">
          {people.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
                <Users size={18} className="text-brand-500" /> People
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {people.map((p) => (
                  <Link
                    key={p.id}
                    to={profilePath(p)}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-300 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <Avatar user={p} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{p.name}</p>
                      {p.username && <p className="truncate text-xs text-slate-500">@{p.username}</p>}
                      {p.bio && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{p.bio}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {tags.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
                <Hash size={18} className="text-brand-500" /> Topics
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t}
                    to={`/tag/${encodeURIComponent(t)}`}
                    className="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-brand-950/40"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {articles.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
                <Search size={18} className="text-brand-500" /> Stories
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
