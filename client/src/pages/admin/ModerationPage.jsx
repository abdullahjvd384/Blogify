import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  RefreshCcw,
  Shield,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Inbox,
  Hash,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import {
  useModerationQueue,
  useAdminApprove,
  useAdminReject,
  useAdminRetry,
} from '@/features/admin/hooks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="warning" leftIcon={<Shield />}>Admin · Moderation</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            Moderation queue
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Review the AI&apos;s flagged articles. Approve to publish, reject with reasons, or
            re-run moderation.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCcw />}
          onClick={() => queue.refetch()}
          isLoading={queue.isFetching}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition',
              status === f.value
                ? 'bg-amber-500 text-white ring-amber-500 shadow-soft'
                : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {queue.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60"
            >
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-3 h-3 w-2/3" />
              <Skeleton className="mt-3 h-3 w-3/4" />
            </div>
          ))}

        {queue.isError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            Failed to load queue.
          </div>
        )}

        {!queue.isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Inbox size={20} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              Nothing in this bucket
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Nice work — the queue is clear. New submissions will appear here.
            </p>
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const job = article.latestJob || {};
  const moderation = article.moderation || {};
  const reasons = moderation.reasons?.length ? moderation.reasons : job.reasons || [];
  const confidence =
    typeof moderation.confidence === 'number' ? moderation.confidence : job.confidence;
  const decidedBy = moderation.decidedBy || job.decidedBy || null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition-all duration-300 hover:border-slate-300 hover:shadow-card dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">
              {article.title || '(Untitled)'}
            </h3>
            <StatusBadge status={article.status} />
            {decidedBy && (
              <Badge variant="default">by {decidedBy}</Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {article.author?.name && (
              <span>
                by{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {article.author.name}
                </span>
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
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={12} />
                Flagged reasons
              </p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                {reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {article.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline" leftIcon={<Hash />}>
                  {tag}
                </Badge>
              ))}
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
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw />}
            onClick={onRetry}
            isLoading={isRetrying}
          >
            Re-run AI
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<XCircle />}
            onClick={onOpenReject}
            disabled={isRejecting}
          >
            Reject
          </Button>
          <Button
            size="sm"
            leftIcon={<CheckCircle2 />}
            onClick={onApprove}
            isLoading={isApproving}
          >
            Approve & publish
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPreviewOpen((v) => !v)}
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ChevronDown
          size={13}
          className={cn('transition-transform', previewOpen && 'rotate-180')}
        />
        {previewOpen ? 'Hide content' : 'Preview content'}
      </button>
      {previewOpen && (
        <div className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/60 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
          {article.content || '(empty)'}
        </div>
      )}

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
      className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900/40 dark:bg-rose-950/30"
    >
      <label className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-200">
        Reasons (one per line, max 5)
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoFocus
        className="mt-2 block w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm shadow-soft focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/15 dark:border-rose-900/40 dark:bg-slate-900 dark:text-slate-100"
        placeholder="off-topic&#10;duplicate of an existing article"
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="danger"
          size="sm"
          isLoading={isPending}
          leftIcon={<XCircle />}
        >
          Confirm reject
        </Button>
      </div>
    </form>
  );
}
