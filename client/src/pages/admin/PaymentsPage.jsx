import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Shield,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Hourglass,
  Wallet,
  AlertCircle,
  Hash,
  Phone,
  X,
} from 'lucide-react';
import {
  useAdminPayments,
  useAdminApprovePayment,
  useAdminRejectPayment,
} from '@/features/payments/hooks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { readApiError } from '@/lib/apiError';
import { cn } from '@/lib/cn';
import { usd } from '@/lib/money';

const FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'success', label: 'Approved' },
  { value: 'failed', label: 'Rejected' },
  { value: '', label: 'All' },
];

function statusBadge(status) {
  if (status === 'success') return <Badge variant="success" leftIcon={<CheckCircle2 />}>Approved</Badge>;
  if (status === 'failed') return <Badge variant="danger" leftIcon={<XCircle />}>Rejected</Badge>;
  if (status === 'refunded') return <Badge variant="default">Refunded</Badge>;
  return <Badge variant="warning" leftIcon={<Hourglass />}>Pending</Badge>;
}

function priceLabel(paisa) {
  return usd(paisa);
}

export default function PaymentsPage() {
  const [status, setStatus] = useState('pending');
  const [rejectTarget, setRejectTarget] = useState(null); // payment object
  const list = useAdminPayments({ status: status || undefined });
  const approveMut = useAdminApprovePayment();
  const rejectMut = useAdminRejectPayment();

  const items = list.data || [];

  async function onApprove(id) {
    try {
      await approveMut.mutateAsync(id);
      toast.success('Approved — subscription activated');
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  async function submitReject(reason) {
    if (!rejectTarget) return;
    try {
      await rejectMut.mutateAsync({ id: rejectTarget.id, reason });
      toast.success('Rejected');
      setRejectTarget(null);
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="warning" leftIcon={<Shield />}>Admin · Payments</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            Payment review
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Card payments are confirmed automatically by Stripe. Any manual entries can be reviewed
            here — approving activates the user&apos;s plan.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCcw />}
          onClick={() => list.refetch()}
          isLoading={list.isFetching}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
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

      <div className="mt-6 space-y-3">
        {list.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}

        {list.isError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            Failed to load payments.
          </div>
        )}

        {!list.isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <Wallet size={28} className="text-slate-400" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {status === 'pending' ? 'No pending payment submissions.' : 'Nothing matches this filter.'}
            </p>
          </div>
        )}

        {items.map((p) => {
          const isPending = p.status === 'pending';
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-semibold capitalize text-slate-900 dark:text-slate-50">
                      {p.planKey} — {priceLabel(p.amountPaisa)}
                    </span>
                    {statusBadge(p.status)}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">{p.user?.name || '—'}</span>
                    {p.user?.email && (
                      <span className="text-slate-500 dark:text-slate-500"> · {p.user.email}</span>
                    )}
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 dark:text-slate-400">
                    <div className="inline-flex items-center gap-1.5">
                      <Hash size={12} className="text-slate-400" />
                      <span>TID:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{p.txnRefNo}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      <span>From:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{p.senderPhone || '—'}</span>
                    </div>
                    <div>Submitted: {new Date(p.createdAt).toLocaleString()}</div>
                    {p.verifiedAt && (
                      <div>Decided: {new Date(p.verifiedAt).toLocaleString()}</div>
                    )}
                  </div>
                  {p.proofNote && (
                    <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                      Note: {p.proofNote}
                    </div>
                  )}
                  {p.status === 'failed' && p.error && (
                    <div className="mt-2 rounded-md border border-red-200 bg-red-50/60 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                      Rejection reason: {p.error}
                    </div>
                  )}
                </div>

                {isPending && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<CheckCircle2 />}
                      onClick={() => onApprove(p.id)}
                      isLoading={approveMut.isPending && approveMut.variables === p.id}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<XCircle />}
                      onClick={() => setRejectTarget(p)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <RejectReasonModal
        open={!!rejectTarget}
        payment={rejectTarget}
        isSubmitting={rejectMut.isPending}
        onClose={() => setRejectTarget(null)}
        onConfirm={submitReject}
      />
    </div>
  );
}

const PRESET_REASONS = [
  "Payment reference could not be verified",
  "Amount paid doesn't match the plan price",
  "Payment details could not be confirmed",
  "Duplicate submission — payment already credited",
];

function RejectReasonModal({ open, payment, isSubmitting, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open) return null;

  function pickPreset(text) {
    setReason(text);
  }

  function submit(e) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={16} />
        </button>

        <div className="border-b border-slate-200 bg-red-50/60 px-6 py-5 dark:border-slate-800 dark:bg-red-950/30">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-red-600 dark:text-red-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-200">
              Reject payment
            </span>
          </div>
          <h2 className="mt-2 font-display text-lg font-bold text-slate-900 dark:text-slate-50">
            {payment?.user?.name || 'User'} — {payment?.planKey} plan
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            TID <span className="font-mono">{payment?.txnRefNo}</span> · the reason below is shown to the user.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick reasons
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => pickPreset(r)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
                >
                  {r.length > 40 ? r.slice(0, 40) + '…' : r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Reason
            </label>
            <textarea
              id="reason"
              rows={4}
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={280}
              placeholder="Explain why this submission was rejected so the user can fix it…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Required, max 280 chars</span>
              <span>{reason.length}/280</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              leftIcon={<XCircle />}
              isLoading={isSubmitting}
              disabled={!reason.trim()}
            >
              Reject payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
