import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Hash, ArrowDown, Check, Plus } from 'lucide-react';
import { useArticleFeed } from '@/features/articles/hooks';
import { useTag, useToggleTagFollow } from '@/features/tags/hooks';
import { useAuthStore } from '@/stores/authStore';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export default function TagPage() {
  const { tag } = useParams();
  const user = useAuthStore((s) => s.user);
  const { data: info } = useTag(tag);
  const toggle = useToggleTagFollow(tag);
  const feed = useArticleFeed({ tag, limit: 20 });

  const items = useMemo(
    () => (feed.data?.pages || []).flatMap((p) => p.data || []),
    [feed.data],
  );
  const isFollowing = Boolean(info?.isFollowing);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-60 bg-radial-fade" />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lift">
              <Hash size={22} />
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
              #{tag}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {(info?.articleCount ?? 0)} {info?.articleCount === 1 ? 'story' : 'stories'} ·{' '}
              {(info?.followerCount ?? 0)} {info?.followerCount === 1 ? 'follower' : 'followers'}
            </p>
          </div>
          {user && (
            <Button
              variant={isFollowing ? 'secondary' : 'primary'}
              leftIcon={isFollowing ? <Check /> : <Plus />}
              onClick={() => toggle.mutate(isFollowing)}
              isLoading={toggle.isPending}
            >
              {isFollowing ? 'Following topic' : 'Follow topic'}
            </Button>
          )}
        </div>

        <div className="mt-10">
          {feed.isLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!feed.isLoading && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/40 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No published stories tagged #{tag} yet.
              </p>
            </div>
          )}

          {items.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((article) => (
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
