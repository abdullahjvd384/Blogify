import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { usePaymentStatus } from '@/features/payments/hooks';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/cn';
import { usd } from '@/lib/money';

const STATUS = {
  success: {
    title: 'Payment confirmed',
    body: 'Your subscription is active. Happy reading.',
    Icon: CheckCircle2,
    accent: 'from-emerald-500 to-teal-500',
    ring: 'ring-emerald-200 dark:ring-emerald-900/60',
  },
  failed: {
    title: 'Payment failed',
    body: 'No charge was made. You can try again anytime.',
    Icon: XCircle,
    accent: 'from-rose-500 to-red-500',
    ring: 'ring-rose-200 dark:ring-rose-900/60',
  },
  refunded: {
    title: 'Payment refunded',
    body: 'This transaction was refunded.',
    Icon: RotateCcw,
    accent: 'from-slate-500 to-slate-700',
    ring: 'ring-slate-200 dark:ring-slate-800',
  },
  pending: {
    title: 'Confirming your payment…',
    body: 'Hang tight — this usually takes a few seconds.',
    Icon: Loader2,
    accent: 'from-amber-500 to-orange-500',
    ring: 'ring-amber-200 dark:ring-amber-900/60',
  },
};

export default function PaymentReturnPage() {
  const [params] = useSearchParams();
  const txnRefNo = params.get('txn');
  const initialStatus = params.get('status');
  const planParam = params.get('plan');
  const message = params.get('message');
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data, isError } = usePaymentStatus(user && txnRefNo ? txnRefNo : null);

  useEffect(() => {
    if (data?.status === 'success') {
      qc.invalidateQueries({ queryKey: ['subscription'] });
    }
  }, [data?.status, qc]);

  if (!txnRefNo) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          No transaction reference
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Open this page from a payment redirect.
        </p>
        <Link to="/pricing" className="mt-6">
          <Button variant="secondary" leftIcon={<ArrowLeft />}>
            See plans
          </Button>
        </Link>
      </div>
    );
  }

  const effectiveStatus = data?.status || initialStatus || 'pending';
  const meta = STATUS[effectiveStatus] || STATUS.pending;
  const Icon = meta.Icon;
  const animateIcon = effectiveStatus === 'pending';

  return (
    <div className="relative isolate">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-fade" />

      <div className="mx-auto max-w-xl px-4 py-20 sm:px-6 lg:px-8">
        <div
          className={cn(
            'overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card ring-1 dark:border-slate-800 dark:bg-slate-900/70',
            meta.ring,
          )}
        >
          <span
            className={cn(
              'mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lift',
              meta.accent,
            )}
          >
            <Icon size={28} className={animateIcon ? 'animate-spin' : ''} />
          </span>

          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {meta.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{meta.body}</p>

          {message && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {decodeURIComponent(message)}
            </p>
          )}

          <dl className="mx-auto mt-7 grid max-w-sm grid-cols-2 gap-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-left text-sm dark:border-slate-800 dark:bg-slate-800/30">
            <dt className="text-slate-500 dark:text-slate-400">Reference</dt>
            <dd className="text-right font-mono text-xs text-slate-700 dark:text-slate-300">
              {txnRefNo}
            </dd>
            {(data?.planKey || planParam) && (
              <>
                <dt className="text-slate-500 dark:text-slate-400">Plan</dt>
                <dd className="text-right font-medium capitalize text-slate-700 dark:text-slate-200">
                  {data?.planKey || planParam}
                </dd>
              </>
            )}
            {data?.amountPaisa !== undefined && data?.amountPaisa !== null && (
              <>
                <dt className="text-slate-500 dark:text-slate-400">Amount</dt>
                <dd className="text-right font-medium text-slate-700 dark:text-slate-200">
                  {usd(data.amountPaisa)}
                </dd>
              </>
            )}
            <dt className="text-slate-500 dark:text-slate-400">Status</dt>
            <dd className="text-right font-medium capitalize text-slate-700 dark:text-slate-200">
              {effectiveStatus}
            </dd>
          </dl>

          {isError && (
            <p className="mt-4 text-xs text-red-600 dark:text-red-400">
              Could not check status. Refresh in a moment.
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <Link to="/articles">
              <Button variant="secondary">Browse articles</Button>
            </Link>
            <Link to="/pricing">
              <Button rightIcon={<ArrowRight />}>Back to plans</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
