import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, AlertCircle, Inbox, ArrowDown, Sparkles, Newspaper } from 'lucide-react';
import { useArticleFeed, useForYouFeed } from '@/features/articles/hooks';
import { useAuthStore } from '@/stores/authStore';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const sortOptions = [
  { key: 'recent', label: 'Recent' },
  { key: 'popular', label: 'Popular' },
  { key: 'quickread', label: 'Quick reads' },
];

export default function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTag = searchParams.get('tag') || '';
  const user = useAuthStore((s) => s.user);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [activeTag, setActiveTag] = useState(urlTag || null);
  const [mode, setMode] = useState('latest'); // 'foryou' | 'latest'

  useEffect(() => {
    setActiveTag(urlTag || null);
  }, [urlTag]);

  const isForYou = mode === 'foryou' && Boolean(user);
  const latestFeed = useArticleFeed({ tag: activeTag || undefined, limit: 20 });
  const forYouFeed = useForYouFeed({ enabled: isForYou });
  const feed = isForYou ? forYouFeed : latestFeed;
  const items = useMemo(
    () => (feed.data?.pages || []).flatMap((p) => p.data || []),
    [feed.data],
  );

  const allTags = useMemo(() => {
    const set = new Set();
    for (const a of items) (a.tags || []).forEach((t) => set.add(t));
    return Array.from(set).slice(0, 12);
  }, [items]);

  const visible = useMemo(() => {
    let list = items;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.excerpt?.toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (sort === 'popular') {
      list = [...list].sort(
        (a, b) => (b.statsSnapshot?.reads || 0) - (a.statsSnapshot?.reads || 0),
      );
    } else if (sort === 'quickread') {
      list = [...list].sort(
        (a, b) => (a.estimatedReadMinutes || 99) - (b.estimatedReadMinutes || 99),
      );
    }
    return list;
  }, [items, query, sort]);

  function selectTag(tag) {
    if (tag === activeTag) {
      setActiveTag(null);
      setSearchParams({});
    } else {
      setActiveTag(tag);
      setSearchParams(tag ? { tag } : {});
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-radial-fade" />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="brand">Discover</Badge>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
              Latest articles
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Browse what writers have been publishing. Filter by tag or sort by what
              matters to you.
            </p>
          </div>

          <div className="w-full sm:max-w-xs">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles…"
              leftIcon={<Search />}
            />
          </div>
        </div>

        {user && (
          <div className="mt-6 inline-flex rounded-lg bg-slate-100 p-1 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <button
              type="button"
              onClick={() => setMode('foryou')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition',
                isForYou
                  ? 'bg-white text-slate-900 shadow-soft dark:bg-slate-800 dark:text-slate-50'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
              )}
            >
              <Sparkles size={14} /> For you
            </button>
            <button
              type="button"
              onClick={() => setMode('latest')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition',
                !isForYou
                  ? 'bg-white text-slate-900 shadow-soft dark:bg-slate-800 dark:text-slate-50'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
              )}
            >
              <Newspaper size={14} /> Latest
            </button>
          </div>
        )}

        {!isForYou && (
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTag(null);
                setSearchParams({});
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition',
                activeTag === null
                  ? 'bg-brand-600 text-white ring-brand-600 shadow-soft'
                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800',
              )}
            >
              All
            </button>
            {(activeTag && !allTags.includes(activeTag)
              ? [activeTag, ...allTags]
              : allTags
            ).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => selectTag(tag)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition',
                  activeTag === tag
                    ? 'bg-brand-600 text-white ring-brand-600 shadow-soft'
                    : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800',
                )}
              >
                #{tag}
              </button>
            ))}
            {allTags.length === 0 && !feed.isLoading && !activeTag && (
              <span className="text-xs text-slate-400">No tags yet</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <div className="inline-flex rounded-lg bg-slate-100 p-1 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSort(opt.key)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition',
                    sort === opt.key
                      ? 'bg-white text-slate-900 shadow-soft dark:bg-slate-800 dark:text-slate-50'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        <div className="mt-10">
          {feed.isError && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">We couldn't load the feed.</p>
                <p className="opacity-80">Please check your connection and try again.</p>
              </div>
            </div>
          )}

          {feed.isLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!feed.isLoading && !feed.isError && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Inbox size={20} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                Nothing to read here yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {query || activeTag
                  ? 'Try clearing your filters or searching for something else.'
                  : 'No articles match the current selection. Check back soon — the feed updates often.'}
              </p>
            </div>
          )}

          {!feed.isLoading && visible.length > 0 && (
            <>
              <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
                Showing{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {visible.length}
                </span>{' '}
                {visible.length === 1 ? 'article' : 'articles'}
                {activeTag && (
                  <>
                    {' '}tagged{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      #{activeTag}
                    </span>
                  </>
                )}
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {feed.hasNextPage && (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    leftIcon={<ArrowDown />}
                    onClick={() => feed.fetchNextPage()}
                    isLoading={feed.isFetchingNextPage}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
