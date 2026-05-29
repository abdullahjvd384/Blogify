import { Link } from 'react-router-dom';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  ArrowRight,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useMySubscription } from '@/features/subscription/hooks';
import { useMyPayments } from '@/features/payments/hooks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

function statusBadge(status) {
  if (status === 'success') return <Badge variant="success" leftIcon={<CheckCircle2 />}>Approved</Badge>;
  if (status === 'failed') return <Badge variant="danger" leftIcon={<XCircle />}>Rejected</Badge>;
  if (status === 'refunded') return <Badge variant="default">Refunded</Badge>;
  return <Badge variant="warning" leftIcon={<Hourglass />}>Pending review</Badge>;
}

function priceLabel(paisa) {
  if (!paisa) return 'PKR 0';
  return `PKR ${(paisa / 100).toLocaleString()}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

export default function SubscriptionPage() {
  const sub = useMySubscription();
  const payments = useMyPayments();

  const plan = sub.data?.plan;
  const subscription = sub.data?.subscription;
  const usage = sub.data?.usage;
  const isMember = sub.data?.isMember;
  const items = payments.data || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge variant="brand" leftIcon={<CreditCard />}>My subscription</Badge>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
        Your plan & payments
      </h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Manage your current plan and track the status of payment submissions.
      </p>

      {/* Current plan card */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-accent-50 p-6 dark:border-slate-800 dark:from-brand-950/40 dark:to-accent-950/40">
        {sub.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Current plan
              </div>
              <div className="mt-1 font-display text-3xl font-bold text-slate-900 dark:text-slate-50">
                {plan?.label || '—'}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {isMember
                  ? 'Unlimited member-only stories'
                  : `${usage?.used ?? 0} / ${usage?.limit ?? 0} free member stories this month`}
                {isMember && subscription?.currentPeriodEnd && (
                  <>
                    {' · '}Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </>
                )}
              </div>
            </div>
            {!isMember && (
              <Link to="/pricing">
                <Button rightIcon={<ArrowRight />}>Become a member</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Payments history */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
            Payment submissions
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => payments.refetch()}
            isLoading={payments.isFetching}
          >
            Refresh
          </Button>
        </div>

        {payments.isLoading && <Skeleton className="h-24 w-full" />}
        {!payments.isLoading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/40 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <Wallet size={28} className="mx-auto text-slate-400" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              No submissions yet. To upgrade, send payment via JazzCash and submit your Transaction ID
              from the pricing page.
            </p>
            <Link to="/pricing" className="mt-4 inline-block">
              <Button leftIcon={<Sparkles />}>See plans</Button>
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-semibold capitalize text-slate-900 dark:text-slate-50">
                        {p.planKey} plan
                      </span>
                      {statusBadge(p.status)}
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {priceLabel(p.amountPaisa)} · TID{' '}
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{p.txnRefNo}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                      <Clock size={12} /> Submitted {fmtDate(p.createdAt)}
                    </div>
                    {p.status === 'failed' && p.error && (
                      <div className="mt-2 rounded-md border border-red-200 bg-red-50/60 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                        Reason: {p.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
