import { useArticleFeed } from '@/features/articles/hooks';
import { ArticleCard } from '@/components/ArticleCard';

export default function FeedPage() {
  const feed = useArticleFeed({ limit: 20 });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Latest articles</h1>
      <p className="mt-1 text-sm text-slate-500">
        Browse what writers have been publishing.
      </p>

      <div className="mt-8 space-y-4">
        {feed.isLoading && <p className="text-sm text-slate-500">Loading…</p>}

        {feed.isError && (
          <p className="text-sm text-red-600">Failed to load feed. Try again later.</p>
        )}

        {feed.data?.data?.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
            No articles published yet.
          </p>
        )}

        {feed.data?.data?.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
