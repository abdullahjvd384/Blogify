import { useState } from 'react';
import { toast } from 'sonner';
import { Coins, Calculator, CheckCircle2, RefreshCw, Lock } from 'lucide-react';
import { usePayoutPeriods, usePayoutPreview, useClosePeriod } from '@/features/payouts/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { readApiError } from '@/lib/apiError';

function rs(paisa) {
  return `Rs ${((paisa || 0) / 100).toLocaleString()}`;
}

function thisMonthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default function PayoutsPage() {
  const [periodKey, setPeriodKey] = useState(thisMonthKey());
  const [active, setActive] = useState(null); // period being previewed
  const periods = usePayoutPeriods();
  const preview = usePayoutPreview(active, Boolean(active));
  const close = useClosePeriod();

  const data = preview.data;

  function runPreview() {
    if (!/^\d{4}-\d{2}$/.test(periodKey)) {
      toast.error('Enter a month as YYYY-MM');
      return;
    }
    setActive(periodKey);
  }

  function finalize() {
    if (!active) return;
    if (!window.confirm(`Finalize ${active}? This credits writer wallets and cannot be undone.`)) return;
    close.mutate(active, {
      onSuccess: () => toast.success(`Period ${active} finalized`),
      onError: (err) => toast.error(readApiError(err)),
    });
  }

  const finalizedKeys = new Set((periods.data || []).filter((p) => p.status !== 'open').map((p) => p.periodKey));
  const alreadyFinal = data && (data.status !== 'open' || finalizedKeys.has(active));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Badge variant="brand" leftIcon={<Coins />}>Payouts</Badge>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Writer payouts
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Preview a month, then finalize to credit writer wallets by member reading-time share.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Month (YYYY-MM)</label>
          <Input value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} className="w-40" placeholder="2026-05" />
        </div>
        <Button variant="secondary" leftIcon={<Calculator />} onClick={runPreview} isLoading={preview.isFetching}>
          Preview
        </Button>
        {data && !alreadyFinal && (
          <Button leftIcon={<Lock />} onClick={finalize} isLoading={close.isPending}>
            Finalize &amp; pay
          </Button>
        )}
        {alreadyFinal && <Badge variant="success" leftIcon={<CheckCircle2 />}>Finalized</Badge>}
      </div>

      {data && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Member revenue" value={rs(data.memberRevenuePaisa)} />
            <Stat label="Writer pool" value={rs(data.poolPaisa)} />
            <Stat label="Total read time" value={`${Math.round(data.totalSeconds / 60)} min`} />
            <Stat label="Writers" value={data.rows.length} />
          </div>

          <h2 className="mt-8 mb-3 font-display text-base font-semibold text-slate-900 dark:text-slate-50">
            Per-writer split
          </h2>
          {data.rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No eligible member reading in {active} yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Writer</th>
                    <th className="px-4 py-3 text-right font-medium">Read time</th>
                    <th className="px-4 py-3 text-right font-medium">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900/40">
                  {data.rows.map((r) => (
                    <tr key={r.writerId}>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                        {r.name}
                        {r.username && <span className="ml-1 text-xs text-slate-400">@{r.username}</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {Math.round(r.seconds / 60)} min
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {rs(r.amountPaisa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">Past periods</h2>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw />} onClick={() => periods.refetch()}>
          Refresh
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {(periods.data || []).map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/60">
            <span className="font-semibold text-slate-900 dark:text-slate-50">{p.periodKey}</span>
            <span className="text-slate-500">{rs(p.poolPaisa)} to {p.writerCount} writers</span>
            <Badge variant={p.status === 'open' ? 'warning' : 'success'}>{p.status}</Badge>
          </div>
        ))}
        {(periods.data || []).length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No periods finalized yet.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 font-display text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{value}</div>
    </div>
  );
}
