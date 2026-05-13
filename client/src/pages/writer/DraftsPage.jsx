import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  FileText,
  Inbox,
  AlertCircle,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import { useMyArticles, useDeleteArticle } from '@/features/articles/hooks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { readApiError } from '@/lib/apiError';
import { cn } from '@/lib/cn';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'needs_review', label: 'In review' },
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="brand" leftIcon={<FileText />}>Writer studio</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            Your articles
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Drafts you&apos;re working on plus everything you&apos;ve submitted or published.
          </p>
        </div>
        <Link to="/writer/new">
          <Button leftIcon={<Plus />}>New article</Button>
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition',
              status === f.value
                ? 'bg-brand-600 text-white ring-brand-600 shadow-soft'
                : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {list.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-3 h-3 w-2/3" />
            </div>
          ))}

        {list.isError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            Could not load your articles.
          </div>
        )}

        {!list.isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Inbox size={20} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              {status ? `Nothing here with status "${status}".` : "You haven't started writing yet."}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Start a draft to see it appear here. Autosave keeps your work safe as you go.
            </p>
            <Link to="/writer/new" className="mt-5">
              <Button leftIcon={<Plus />}>Start writing</Button>
            </Link>
          </div>
        )}

        {items.map((article) => (
          <div
            key={article.id}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-brand-700"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/writer/edit/${article.id}`}
                    className="truncate text-base font-semibold text-slate-900 hover:text-brand-600 dark:text-slate-50 dark:hover:text-brand-300"
                  >
                    {article.title || '(Untitled)'}
                  </Link>
                  <StatusBadge status={article.status} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>{article.wordCount || 0} words</span>
                  <span>·</span>
                  <span>Updated {new Date(article.updatedAt).toLocaleString()}</span>
                  {article.tags?.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Hash size={11} className="opacity-70" />
                      {article.tags.slice(0, 4).join(', ')}
                    </span>
                  )}
                </div>

                {article.status === 'rejected' && article.moderation?.reasons?.length > 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>
                      <span className="font-semibold">Rejected</span>
                      {article.moderation.decidedBy && (
                        <span className="opacity-80"> by {article.moderation.decidedBy}</span>
                      )}
                      : {article.moderation.reasons.join('; ')}
                    </span>
                  </div>
                )}
                {article.status === 'needs_review' && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>
                      Flagged for human review.
                      {article.moderation?.reasons?.length > 0 && (
                        <> Reasons: {article.moderation.reasons.join('; ')}</>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {article.status === 'published' && (
                  <Link to={`/articles/${article.slug}`}>
                    <Button variant="ghost" size="sm" leftIcon={<ExternalLink />}>
                      View
                    </Button>
                  </Link>
                )}
                <Link to={`/writer/edit/${article.id}`}>
                  <Button variant="secondary" size="sm" leftIcon={<Pencil />}>
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 />}
                  onClick={() => onDelete(article.id)}
                  isLoading={removeMut.isPending && removeMut.variables === article.id}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
