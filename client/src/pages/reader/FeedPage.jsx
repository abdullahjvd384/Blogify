import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useArticleFeed } from '@/features/articles/hooks';
import { ArticleCard } from '@/components/ArticleCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFromUrl = searchParams.get('tag') || '';
  const [tagInput, setTagInput] = useState(tagFromUrl);

  const feed = useArticleFeed({ tag: tagFromUrl || undefined, limit: 20 });
  const items = useMemo(
    () => (feed.data?.pages || []).flatMap((p) => p.data || []),
    [feed.data],
  );

  function applyTag(e) {
    e.preventDefault();
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed) setSearchParams({ tag: trimmed });
    else setSearchParams({});
  }

  function clearTag() {
    setTagInput('');
    setSearchParams({});
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Latest articles</h1>
      <p className="mt-1 text-sm text-slate-500">
        Browse what writers have been publishing.
      </p>

      <form onSubmit={applyTag} className="mt-6 flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Filter by tag (e.g. javascript)"
          className="max-w-xs"
        />
        <Button type="submit" variant="secondary" size="md">
          Apply
        </Button>
        {tagFromUrl && (
          <Button type="button" variant="ghost" size="md" onClick={clearTag}>
            Clear
          </Button>
        )}
      </form>
      {tagFromUrl && (
        <p className="mt-2 text-xs text-slate-500">
          Showing articles tagged <span className="font-medium">{tagFromUrl}</span>
        </p>
      )}

      <div className="mt-8 space-y-4">
        {feed.isLoading && <p className="text-sm text-slate-500">Loading…</p>}

        {feed.isError && (
          <p className="text-sm text-red-600">Failed to load feed. Try again later.</p>
        )}

        {!feed.isLoading && items.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
            {tagFromUrl ? `No articles tagged "${tagFromUrl}".` : 'No articles published yet.'}
          </p>
        )}

        {items.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}

        {feed.hasNextPage && (
          <div className="pt-4 text-center">
            <Button
              variant="secondary"
              onClick={() => feed.fetchNextPage()}
              isLoading={feed.isFetchingNextPage}
            >
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
