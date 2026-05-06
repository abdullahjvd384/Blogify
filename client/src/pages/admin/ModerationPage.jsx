import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useModerationQueue,
  useAdminApprove,
  useAdminReject,
  useAdminRetry,
} from '@/features/admin/hooks';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { readApiError } from '@/lib/apiError';
import { cn } from '@/lib/cn';

const FILTERS = [
  { value: 'needs_review', label: 'Needs review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In review' },
];

export default function ModerationPage() {
  const [status, setStatus] = useState('needs_review');
  const [openReject, setOpenReject] = useState(null);

  const queue = useModerationQueue({ status, limit: 30 });
  const approveMut = useAdminApprove();
  const rejectMut = useAdminReject();
  const retryMut = useAdminRetry();

  const items = queue.data?.data || [];

  async function onApprove(id) {
    try {
      await approveMut.mutateAsync(id);
      toast.success('Approved & published');
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  async function onRetry(id) {
    try {
      await retryMut.mutateAsync(id);
      toast.success('Re-queued for moderation');
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  async function onReject(id, reasons) {
    try {
      await rejectMut.mutateAsync({ id, reasons });
      toast.success('Rejected');
      setOpenReject(null);
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Moderation queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review the AI&apos;s flagged articles. Approve to publish, reject with reasons, or
            re-run moderation.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => queue.refetch()}
          isLoading={queue.isFetching}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              status === f.value
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {queue.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {queue.isError && (
          <p className="text-sm text-red-600">Failed to load queue.</p>
        )}
        {!queue.isLoading && items.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
            Nothing in this bucket. Nice work.
          </div>
        )}

        {items.map((article) => (
          <ModerationCard
            key={article.id}
            article={article}
            isOpenReject={openReject === article.id}
            onOpenReject={() => setOpenReject(article.id)}
            onCloseReject={() => setOpenReject(null)}
            onApprove={() => onApprove(article.id)}
            onRetry={() => onRetry(article.id)}
            onReject={(reasons) => onReject(article.id, reasons)}
            isApproving={approveMut.isPending && approveMut.variables === article.id}
            isRejecting={rejectMut.isPending && rejectMut.variables?.id === article.id}
            isRetrying={retryMut.isPending && retryMut.variables === article.id}
          />
        ))}
      </div>
    </div>
  );
}

function ModerationCard({
  article,
  isOpenReject,
  onOpenReject,
  onCloseReject,
  onApprove,
  onRetry,
  onReject,
  isApproving,
  isRejecting,
  isRetrying,
}) {
  const job = article.latestJob || {};
  const moderation = article.moderation || {};
  const reasons = moderation.reasons?.length ? moderation.reasons : job.reasons || [];
  const confidence = typeof moderation.confidence === 'number' ? moderation.confidence : job.confidence;
  const decidedBy = moderation.decidedBy || job.decidedBy || null;

  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold">
              {article.title || '(Untitled)'}
            </h3>
            <StatusBadge status={article.status} />
            {decidedBy && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                by {decidedBy}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {article.author?.name && (
              <span>
                by <span className="font-medium text-slate-700 dark:text-slate-300">{article.author.name}</span>
              </span>
            )}
            {article.author?.email && <span>· {article.author.email}</span>}
            <span>· {article.wordCount || 0} words</span>
            {typeof confidence === 'number' && (
              <span>· confidence {(confidence * 100).toFixed(0)}%</span>
            )}
            <span>· updated {new Date(article.updatedAt).toLocaleString()}</span>
          </div>
          {reasons.length > 0 && (
            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
              <p className="font-medium">Flagged reasons</p>
              <ul className="mt-1 list-disc pl-5">
                {reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {article.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {article.status === 'published' ? (
            <Link to={`/articles/${article.slug}`}>
              <Button variant="ghost" size="sm">View</Button>
            </Link>
          ) : null}
          <Button variant="secondary" size="sm" onClick={onRetry} isLoading={isRetrying}>
            Re-run AI
          </Button>
          <Button variant="danger" size="sm" onClick={onOpenReject} disabled={isRejecting}>
            Reject
          </Button>
          <Button size="sm" onClick={onApprove} isLoading={isApproving}>
            Approve & publish
          </Button>
        </div>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          Preview content
        </summary>
        <div className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {article.content || '(empty)'}
        </div>
      </details>

      {isOpenReject && (
        <RejectForm
          onCancel={onCloseReject}
          onSubmit={onReject}
          isPending={isRejecting}
          initialReasons={reasons}
        />
      )}
    </div>
  );
}

function RejectForm({ onCancel, onSubmit, isPending, initialReasons = [] }) {
  const [text, setText] = useState(initialReasons.join('\n'));

  function submit(e) {
    e.preventDefault();
    const reasons = text
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);
    if (reasons.length === 0) return;
    onSubmit(reasons.slice(0, 5));
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-900/20"
    >
      <label className="text-xs font-medium text-red-900 dark:text-red-200">
        Reasons (one per line, max 5)
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoFocus
        className="mt-1 block w-full rounded-md border border-red-300 bg-white px-2 py-1.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-900/40 dark:bg-slate-900"
        placeholder="off-topic&#10;duplicate of an existing article"
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" size="sm" isLoading={isPending}>
          Confirm reject
        </Button>
      </div>
    </form>
  );
}
