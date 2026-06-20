import { useState } from 'react';
import { toast } from 'sonner';
import { Banknote, Check, X, RefreshCw } from 'lucide-react';
import { useAdminWithdrawals, useMarkWithdrawalPaid, useRejectWithdrawal } from '@/features/payouts/hooks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { readApiError } from '@/lib/apiError';
import { usd as rs } from '@/lib/money';

const TABS = ['requested', 'approved', 'paid', 'rejected', 'all'];

function statusBadge(s) {
  if (s === 'paid') return <Badge variant="success">Paid</Badge>;
  if (s === 'rejected') return <Badge variant="danger">Rejected</Badge>;
  if (s === 'approved') return <Badge variant="brand">Approved</Badge>;
  return <Badge variant="warning">Requested</Badge>;
}

export default function WithdrawalsPage() {
  const [tab, setTab] = useState('requested');
  const list = useAdminWithdrawals(tab === 'all' ? undefined : tab);
  const markPaid = useMarkWithdrawalPaid();
  const reject = useRejectWithdrawal();
  const items = list.data || [];

  function onMarkPaid(id) {
    if (!window.confirm('Confirm you have paid this writer to their payout account?')) return;
    markPaid.mutate(id, {
      onSuccess: () => toast.success('Marked as paid'),
      onError: (err) => toast.error(readApiError(err)),
    });
  }

  function onReject(id) {
    const note = window.prompt('Reason for rejection (optional):') || undefined;
    reject.mutate(
      { id, note },
      {
        onSuccess: () => toast.success('Withdrawal rejected — funds returned to the writer'),
        onError: (err) => toast.error(readApiError(err)),
      },
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Badge variant="brand" leftIcon={<Banknote />}>Withdrawals</Badge>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Writer withdrawals
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Pay the writer to their payout account out-of-band, then mark the request paid. Rejecting
        returns the funds to their balance.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                tab === t
                  ? 'bg-white text-slate-900 shadow-soft dark:bg-slate-800 dark:text-slate-50'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw />} onClick={() => list.refetch()}>
          Refresh
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {list.isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {!list.isLoading && items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No {tab === 'all' ? '' : tab} withdrawals.
          </p>
        )}
        {items.map((w) => (
          <div key={w.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">{rs(w.amountPaisa)}</span>
                  {statusBadge(w.status)}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {w.writer?.name || 'Unknown'}
                  {w.writer?.username && <span className="text-xs text-slate-400"> @{w.writer.username}</span>}
                  {' · '}Payout to <span className="font-mono text-xs">{w.accountNumber}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Requested {new Date(w.createdAt).toLocaleString()}
                  {w.note && <> · Note: {w.note}</>}
                </div>
              </div>
              {w.status === 'requested' && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" leftIcon={<X />} onClick={() => onReject(w.id)}>
                    Reject
                  </Button>
                  <Button size="sm" leftIcon={<Check />} onClick={() => onMarkPaid(w.id)}>
                    Mark paid
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
