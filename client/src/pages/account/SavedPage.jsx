import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, Bookmark } from 'lucide-react';
import { useSavedArticles } from '@/features/bookmarks/hooks';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function SavedPage() {
  const saved = useSavedArticles({ limit: 12 });
  const items = useMemo(
    () => (saved.data?.pages || []).flatMap((p) => p.data || []),
    [saved.data],
  );

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-60 bg-radial-fade" />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <Badge variant="brand">
          <Bookmark size={12} className="mr-1" /> Library
        </Badge>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
          Saved articles
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
          Stories you bookmarked to read later.
        </p>

        <div className="mt-10">
          {saved.isLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!saved.isLoading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Bookmark size={20} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                Nothing saved yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Tap the bookmark icon on any article to save it here.
              </p>
              <Link to="/articles" className="mt-6">
                <Button variant="outline">Browse articles</Button>
              </Link>
            </div>
          )}

          {items.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
              {saved.hasNextPage && (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    leftIcon={<ArrowDown />}
                    onClick={() => saved.fetchNextPage()}
                    isLoading={saved.isFetchingNextPage}
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
