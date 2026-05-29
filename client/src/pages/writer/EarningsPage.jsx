import { useState } from 'react';
import { toast } from 'sonner';
import { Wallet, Coins, Hourglass, TrendingUp, Banknote, Clock } from 'lucide-react';
import { MEMBERSHIP } from '@blogplatform/shared';
import { useMyEarnings, useMyWithdrawals, useRequestWithdrawal } from '@/features/payouts/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { readApiError } from '@/lib/apiError';

const MIN_PKR = MEMBERSHIP.MIN_WITHDRAWAL_PAISA / 100;

function rs(paisa) {
  return `Rs ${((paisa || 0) / 100).toLocaleString()}`;
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}

function withdrawalBadge(status) {
  if (status === 'paid') return <Badge variant="success">Paid</Badge>;
  if (status === 'rejected') return <Badge variant="danger">Rejected</Badge>;
  if (status === 'approved') return <Badge variant="brand">Approved</Badge>;
  return <Badge variant="warning">Requested</Badge>;
}

export default function EarningsPage() {
  const { data, isLoading } = useMyEarnings();
  const withdrawals = useMyWithdrawals();
  const request = useRequestWithdrawal();
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');

  const wallet = data?.wallet;
  const current = data?.currentPeriod;
  const earnings = data?.earnings || [];
  const available = wallet?.availablePaisa || 0;

  function submitWithdrawal(e) {
    e.preventDefault();
    const pkr = Number(amount);
    if (!Number.isFinite(pkr) || pkr < MIN_PKR) {
      toast.error(`Minimum withdrawal is Rs ${MIN_PKR.toLocaleString()}`);
      return;
    }
    request.mutate(
      { amountPaisa: Math.round(pkr * 100), accountNumber: account.trim() },
      {
        onSuccess: () => {
          toast.success('Withdrawal requested — an admin will process it shortly');
          setAmount('');
          setAccount('');
        },
        onError: (err) => toast.error(readApiError(err)),
      },
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <Badge variant="brand" leftIcon={<Coins />}>Earnings</Badge>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
        Your earnings
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        You earn a share of membership revenue based on how long members spend reading your
        member-only stories. {MEMBERSHIP.PAYOUT_PERCENT}% of membership revenue goes to writers each month.
      </p>

      {isLoading ? (
        <div className="mt-8 h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Wallet} label="Available" value={rs(available)} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300" />
            <StatCard icon={Hourglass} label="Pending" value={rs(wallet?.pendingPaisa)} accent="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300" />
            <StatCard icon={Coins} label="Lifetime" value={rs(wallet?.lifetimePaisa)} accent="bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300" />
            <StatCard icon={TrendingUp} label={`This month (est.)`} value={rs(current?.estimatedPaisa)} accent="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300" />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            This month&apos;s estimate ({current?.periodKey}) updates live and is finalized after month-end.
          </p>

          {/* Withdraw */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
              <Banknote size={18} className="text-brand-500" /> Withdraw to JazzCash
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Available to withdraw: <span className="font-semibold">{rs(available)}</span> · minimum Rs {MIN_PKR.toLocaleString()}.
            </p>
            <form onSubmit={submitWithdrawal} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label="Amount (PKR)" htmlFor="amount">
                <Input id="amount" type="number" min={MIN_PKR} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(MIN_PKR)} />
              </Field>
              <Field label="JazzCash number" htmlFor="account">
                <Input id="account" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="03XX-XXXXXXX" />
              </Field>
              <Button type="submit" isLoading={request.isPending} disabled={available < MEMBERSHIP.MIN_WITHDRAWAL_PAISA}>
                Request
              </Button>
            </form>
            {available < MEMBERSHIP.MIN_WITHDRAWAL_PAISA && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Keep writing member-only stories to reach the Rs {MIN_PKR.toLocaleString()} minimum.
              </p>
            )}
          </div>

          {/* Withdrawal history */}
          {(withdrawals.data || []).length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">Withdrawals</h2>
              <div className="space-y-2">
                {withdrawals.data.map((w) => (
                  <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">{rs(w.amountPaisa)}</span>
                    <span className="font-mono text-xs text-slate-500">{w.accountNumber}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} /> {new Date(w.createdAt).toLocaleDateString()}
                    </span>
                    {withdrawalBadge(w.status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Earnings history */}
          <div className="mt-10">
            <h2 className="mb-3 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">Monthly earnings</h2>
            {earnings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/40 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No finalized earnings yet. Earnings are credited after each month closes.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Month</th>
                      <th className="px-4 py-3 text-right font-medium">Member read time</th>
                      <th className="px-4 py-3 text-right font-medium">Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900/40">
                    {earnings.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{e.periodKey}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                          {Math.round(e.seconds / 60)} min
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {rs(e.amountPaisa)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
