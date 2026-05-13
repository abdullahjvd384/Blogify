import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  Eye,
  Calendar,
  Bookmark,
  Share2,
  Copy,
  AlertTriangle,
  FileQuestion,
  Sparkles,
  Tag as TagIcon,
} from 'lucide-react';
import { useArticle, useVote } from '@/features/articles/hooks';
import { useReadTracker } from '@/features/reads/useReadTracker';
import { useAuthStore } from '@/stores/authStore';
import { VoteButtons } from '@/components/VoteButtons';
import { PaywallModal } from '@/components/PaywallModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { readApiError } from '@/lib/apiError';
import { cn } from '@/lib/cn';

function getAuthorInitials(article) {
  const source = article?.authorName || article?.author?.name || article?.author?.email || 'A';
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || source[0].toUpperCase();
}

function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-6 h-10 w-3/4" />
      <Skeleton className="mt-3 h-10 w-2/3" />
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="mt-10 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={cn('h-4', i % 3 === 2 ? 'w-3/4' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}

export default function ArticlePage() {
  const { slug } = useParams();
  const { data: article, isLoading, isError, error } = useArticle(slug);
  const user = useAuthStore((s) => s.user);
  const voteMut = useVote(slug);
  const qc = useQueryClient();

  const quotaError =
    error?.response?.status === 402 ? error.response.data?.error?.details : null;
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (quotaError) setPaywallOpen(true);
  }, [quotaError]);

  useEffect(() => {
    if (article?.usage) qc.invalidateQueries({ queryKey: ['subscription', 'me'] });
  }, [article?.usage, qc]);

  const isAuthor = user && article?.author?.id === user.id;
  const isAdmin = user?.role === 'admin';
  const trackerEnabled = Boolean(
    user && article?.id && article?.status === 'published' && !isAuthor && !isAdmin,
  );
  useReadTracker({ articleId: article?.id, enabled: trackerEnabled });

  const [progress, setProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const height = doc.scrollHeight - doc.clientHeight;
      const scrolled = window.scrollY;
      setProgress(height > 0 ? Math.min(100, (scrolled / height) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isLoading) return <ArticleSkeleton />;

  if (quotaError) {
    return (
      <>
        <div className="relative mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-fade" />
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lift">
            <Sparkles size={22} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Daily reading limit reached
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You&apos;ve used{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {quotaError.used}/{quotaError.limit}
            </span>{' '}
            articles on the <span className="capitalize">{quotaError.plan}</span> plan today.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link to="/articles">
              <Button variant="secondary" leftIcon={<ArrowLeft />}>
                Back to feed
              </Button>
            </Link>
            <Button onClick={() => setPaywallOpen(true)} leftIcon={<Sparkles />}>
              See plans
            </Button>
          </div>
        </div>
        <PaywallModal
          open={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          usage={quotaError}
        />
      </>
    );
  }

  if (isError) {
    const status = error?.response?.status;
    if (status === 401) {
      return (
        <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
            <Sparkles size={22} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Log in to read this article
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Articles are free to read with a free account. Sign up takes about ten seconds.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link to={`/login?from=/articles/${slug}`}>
              <Button>Log in</Button>
            </Link>
            <Link to={`/signup?from=/articles/${slug}`}>
              <Button variant="outline">Sign up</Button>
            </Link>
          </div>
        </div>
      );
    }
    if (status === 404) {
      return (
        <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <FileQuestion size={22} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Article not found
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The article you're looking for may have been moved or unpublished.
          </p>
          <Link to="/articles" className="mt-6">
            <Button variant="outline" leftIcon={<ArrowLeft />}>
              Back to feed
            </Button>
          </Link>
        </div>
      );
    }
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300">
          <AlertTriangle size={22} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Could not load article
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Please check your connection and try again.
        </p>
      </div>
    );
  }

  const authorName = article.authorName || article.author?.name || 'Anonymous';
  const date = article.publishedAt || article.createdAt;
  const stats = article.statsSnapshot || {};

  function handleVote(value) {
    voteMut.mutate(
      { id: article.id, value },
      { onError: (err) => toast.error(readApiError(err)) },
    );
  }

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy');
    }
  }

  return (
    <div className="relative">
      {/* Reading progress bar */}
      <div className="fixed inset-x-0 top-16 z-30 h-0.5 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hero */}
      <header className="relative isolate overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-fade" />
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8">
          <Link
            to="/articles"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <ArrowLeft size={14} />
            Back to feed
          </Link>

          {article.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {article.tags.slice(0, 6).map((tag) => (
                <Link key={tag} to={`/articles?tag=${encodeURIComponent(tag)}`}>
                  <Badge variant="brand" leftIcon={<TagIcon />}>
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance sm:text-5xl dark:text-slate-50">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-4 text-lg leading-7 text-slate-600 text-pretty dark:text-slate-300">
              {article.excerpt}
            </p>
          )}

          {article.coverImageUrl && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <img
                src={article.coverImageUrl}
                alt=""
                className="block w-full"
                loading="lazy"
              />
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-semibold text-white shadow-soft"
                aria-hidden
              >
                {getAuthorInitials(article)}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {authorName}
                </p>
                {date && (
                  <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar size={11} />
                    {new Date(date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            <span className="hidden h-6 w-px bg-slate-200 dark:bg-slate-800 sm:inline-block" />

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} />
                {article.estimatedReadMinutes || 1} min read
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye size={13} />
                {stats.reads || 0} reads
              </span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBookmarked((v) => !v)}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset transition',
                  bookmarked
                    ? 'bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900'
                    : 'text-slate-500 ring-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:ring-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                )}
                aria-label="Bookmark"
              >
                <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:ring-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Copy link"
              >
                <Copy size={15} />
              </button>
              <Button size="sm" variant="secondary" leftIcon={<Share2 />} onClick={handleShare}>
                Share
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <VoteButtons
              upvotes={stats.upvotes || 0}
              downvotes={stats.downvotes || 0}
              myVote={article.myVote || 0}
              onVote={handleVote}
              disabled={!user}
              isPending={voteMut.isPending}
            />
            {!user && (
              <Link
                to="/login"
                className="text-xs text-slate-500 hover:underline dark:text-slate-400"
              >
                Sign in to vote
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <article className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6 sm:pb-28 lg:px-8">
        <div className="article-body whitespace-pre-wrap font-serif text-[1.075rem] leading-[1.85] text-slate-700 dark:text-slate-300">
          {article.content}
        </div>

        {/* Footer engagement */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-semibold text-white">
              {getAuthorInitials(article)}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Written by {authorName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enjoyed this read? Tap upvote or share it with a friend.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VoteButtons
              upvotes={stats.upvotes || 0}
              downvotes={stats.downvotes || 0}
              myVote={article.myVote || 0}
              onVote={handleVote}
              disabled={!user}
              isPending={voteMut.isPending}
            />
            <Button size="sm" variant="outline" leftIcon={<Share2 />} onClick={handleShare}>
              Share
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
