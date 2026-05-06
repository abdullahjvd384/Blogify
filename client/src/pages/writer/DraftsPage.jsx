import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { useMyArticles, useDeleteArticle } from '@/features/articles/hooks';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { readApiError } from '@/lib/apiError';
import { cn } from '@/lib/cn';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
];

export default function DraftsPage() {
  const [status, setStatus] = useState('');
  const list = useMyArticles({ status });
  const removeMut = useDeleteArticle();
  const items = list.data?.data || [];

  async function onDelete(id) {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
      await removeMut.mutateAsync(id);
      toast.success('Article deleted');
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your articles</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drafts you&apos;re working on plus everything you&apos;ve submitted or published.
          </p>
        </div>
        <Link to="/writer/new">
          <Button>New article</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              status === f.value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {list.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {list.isError && (
          <p className="text-sm text-red-600">Could not load your articles.</p>
        )}
        {!list.isLoading && items.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
            <p className="text-sm text-slate-500">
              {status ? `Nothing here with status "${status}".` : "You haven't started any articles yet."}
            </p>
            <Link to="/writer/new" className="mt-3 inline-block">
              <Button variant="secondary" size="sm">
                Start writing
              </Button>
            </Link>
          </div>
        )}

        {items.map((article) => (
          <div
            key={article.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  to={`/writer/edit/${article.id}`}
                  className="truncate text-base font-semibold hover:underline"
                >
                  {article.title || '(Untitled)'}
                </Link>
                <StatusBadge status={article.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{article.wordCount || 0} words</span>
                <span>·</span>
                <span>updated {new Date(article.updatedAt).toLocaleString()}</span>
                {article.tags?.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="truncate">{article.tags.join(', ')}</span>
                  </>
                )}
              </div>
              {article.status === 'rejected' && article.moderation?.reasons?.length > 0 && (
                <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                  <span className="font-medium">Rejected</span>
                  {article.moderation.decidedBy && (
                    <span className="text-red-600/80 dark:text-red-300/80">
                      {' '}
                      by {article.moderation.decidedBy}
                    </span>
                  )}
                  : {article.moderation.reasons.join('; ')}
                </div>
              )}
              {article.status === 'needs_review' && (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                  Flagged for human review.
                  {article.moderation?.reasons?.length > 0 && (
                    <> Reasons: {article.moderation.reasons.join('; ')}</>
                  )}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {article.status === 'published' && (
                <Link to={`/articles/${article.slug}`}>
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              )}
              <Link to={`/writer/edit/${article.id}`}>
                <Button variant="secondary" size="sm">Edit</Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(article.id)}
                isLoading={removeMut.isPending && removeMut.variables === article.id}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
