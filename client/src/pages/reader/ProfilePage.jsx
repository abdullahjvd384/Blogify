import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, FileQuestion, PenLine, Settings } from 'lucide-react';
import { useProfile, useProfileArticles } from '@/features/profiles/hooks';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/Avatar';
import { FollowButton } from '@/components/FollowButton';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { handle } = useParams();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading, isError, error } = useProfile(handle);
  const articles = useProfileArticles(handle);

  const items = useMemo(
    () => (articles.data?.pages || []).flatMap((p) => p.data || []),
    [articles.data],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-24 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-7 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (isError) {
    const notFound = error?.response?.status === 404;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <FileQuestion size={22} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {notFound ? 'Profile not found' : 'Could not load profile'}
        </h1>
        <Link to="/articles" className="mt-6">
          <Button variant="outline">Back to feed</Button>
        </Link>
      </div>
    );
  }

  const isMe = profile.isMe || (user && user.id === profile.id);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-60 bg-radial-fade" />
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 sm:gap-5">
            <Avatar user={profile} size="xl" />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                {profile.name}
              </h1>
              {profile.username && (
                <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>
              )}
              {profile.role === 'admin' && (
                <Badge variant="brand" className="mt-2">
                  Admin
                </Badge>
              )}
              {profile.bio && (
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {profile.bio}
                </p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {profile.followersCount || 0}
                  </span>{' '}
                  followers
                </span>
                <span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {profile.followingCount || 0}
                  </span>{' '}
                  following
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {isMe ? (
              <Link to="/account/settings">
                <Button size="sm" variant="secondary" leftIcon={<Settings />}>
                  Edit profile
                </Button>
              </Link>
            ) : (
              <FollowButton handle={handle} size="md" />
            )}
          </div>
        </div>

        {/* Articles */}
        <div className="mt-12">
          <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
            <PenLine size={18} className="text-brand-500" />
            Published articles
          </h2>

          {articles.isLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!articles.isLoading && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/40 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isMe ? "You haven't published anything yet." : 'No published articles yet.'}
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
              {articles.hasNextPage && (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    leftIcon={<ArrowDown />}
                    onClick={() => articles.fetchNextPage()}
                    isLoading={articles.isFetchingNextPage}
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
