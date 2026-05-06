import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useArticle, useVote } from '@/features/articles/hooks';
import { useAuthStore } from '@/stores/authStore';
import { VoteButtons } from '@/components/VoteButtons';
import { PaywallModal } from '@/components/PaywallModal';
import { readApiError } from '@/lib/apiError';

export default function ArticlePage() {
  const { slug } = useParams();
  const { data: article, isLoading, isError, error } = useArticle(slug);
  const user = useAuthStore((s) => s.user);
  const voteMut = useVote(slug);
  const qc = useQueryClient();

  // Quota responses are surfaced as 402 with `details: { plan, used, limit, resetAt }`.
  // We grab those details and pop the paywall; reading the same article tomorrow
  // (or after upgrade) just refetches.
  const quotaError =
    error?.response?.status === 402 ? error.response.data?.error?.details : null;
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (quotaError) setPaywallOpen(true);
  }, [quotaError]);

  // Refresh subscription cache after a successful read so the header chip stays in sync.
  useEffect(() => {
    if (article?.usage) qc.invalidateQueries({ queryKey: ['subscription', 'me'] });
  }, [article?.usage, qc]);

  if (isLoading) {
    return <p className="mx-auto max-w-3xl px-6 py-16 text-sm text-slate-500">Loading…</p>;
  }

  if (quotaError) {
    return (
      <>
        <div className="mx-auto max-w-md py-20 text-center">
          <h1 className="text-xl font-semibold">Daily reading limit reached</h1>
          <p className="mt-2 text-sm text-slate-500">
            You&apos;ve used{' '}
            <span className="font-medium">
              {quotaError.used}/{quotaError.limit}
            </span>{' '}
            articles on the {quotaError.plan} plan today.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/articles">
              <button className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">
                Back to feed
              </button>
            </Link>
            <button
              onClick={() => setPaywallOpen(true)}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              See plans
            </button>
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
    if (status === 404) {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="text-xl font-semibold">Article not found</h1>
          <Link to="/articles" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
            Back to feed
          </Link>
        </div>
      );
    }
    return (
      <p className="mx-auto max-w-3xl px-6 py-16 text-sm text-red-600">
        Could not load article.
      </p>
    );
  }

  const stats = article.statsSnapshot || {};

  function handleVote(value) {
    voteMut.mutate(
      { id: article.id, value },
      { onError: (err) => toast.error(readApiError(err)) },
    );
  }

  return (
    <article className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        {article.author?.name && (
          <span>
            by <span className="font-medium text-slate-700 dark:text-slate-200">{article.author.name}</span>
          </span>
        )}
        {article.publishedAt && (
          <>
            <span>·</span>
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          </>
        )}
        <span>·</span>
        <span>{article.estimatedReadMinutes} min read</span>
        <span>·</span>
        <span>{stats.reads || 0} reads</span>
      </div>

      {article.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <Link
              key={tag}
              to={`/articles?tag=${encodeURIComponent(tag)}`}
              className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <VoteButtons
          upvotes={stats.upvotes || 0}
          downvotes={stats.downvotes || 0}
          myVote={article.myVote || 0}
          onVote={handleVote}
          disabled={!user}
          isPending={voteMut.isPending}
        />
        {!user && (
          <Link to="/login" className="text-xs text-slate-500 hover:underline">
            Sign in to vote
          </Link>
        )}
      </div>

      <div className="prose prose-slate mt-8 max-w-none whitespace-pre-wrap dark:prose-invert">
        {article.content}
      </div>
    </article>
  );
}
