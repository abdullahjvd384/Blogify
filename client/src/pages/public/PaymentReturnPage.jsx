import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { usePaymentStatus } from '@/features/payments/hooks';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

const STATUS_COPY = {
  success: {
    title: 'Payment confirmed',
    body: 'Your subscription is active. Happy reading.',
    accent: 'text-emerald-700 dark:text-emerald-300',
  },
  failed: {
    title: 'Payment failed',
    body: 'No charge was made. You can try again anytime.',
    accent: 'text-red-700 dark:text-red-300',
  },
  refunded: {
    title: 'Payment refunded',
    body: 'This transaction was refunded.',
    accent: 'text-slate-700 dark:text-slate-200',
  },
  pending: {
    title: 'Confirming your payment…',
    body: 'Hang tight — this usually takes a few seconds.',
    accent: 'text-slate-700 dark:text-slate-200',
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

  // Once the payment is final, refresh subscription state so the chip + pricing
  // page show the new plan immediately.
  useEffect(() => {
    if (data?.status === 'success') {
      qc.invalidateQueries({ queryKey: ['subscription'] });
    }
  }, [data?.status, qc]);

  if (!txnRefNo) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-xl font-semibold">No transaction reference</h1>
        <p className="mt-2 text-sm text-slate-500">
          Open this page from a payment redirect.
        </p>
        <Link to="/pricing" className="mt-4 inline-block">
          <Button variant="secondary">See plans</Button>
        </Link>
      </div>
    );
  }

  const effectiveStatus = data?.status || initialStatus || 'pending';
  const copy = STATUS_COPY[effectiveStatus] || STATUS_COPY.pending;

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className={`text-2xl font-semibold ${copy.accent}`}>{copy.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{copy.body}</p>

      {message && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          {decodeURIComponent(message)}
        </p>
      )}

      <dl className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-y-1 rounded-md border border-slate-200 p-4 text-left text-sm dark:border-slate-800">
        <dt className="text-slate-500">Reference</dt>
        <dd className="text-right font-mono text-xs">{txnRefNo}</dd>
        {(data?.planKey || planParam) && (
          <>
            <dt className="text-slate-500">Plan</dt>
            <dd className="text-right capitalize">{data?.planKey || planParam}</dd>
          </>
        )}
        {data?.amountPaisa !== undefined && data?.amountPaisa !== null && (
          <>
            <dt className="text-slate-500">Amount</dt>
            <dd className="text-right">
              Rs {(data.amountPaisa / 100).toLocaleString()}
            </dd>
          </>
        )}
        <dt className="text-slate-500">Status</dt>
        <dd className="text-right capitalize">{effectiveStatus}</dd>
      </dl>

      {isError && (
        <p className="mt-4 text-xs text-red-600">
          Could not check status. Refresh in a moment.
        </p>
      )}

      <div className="mt-8 flex justify-center gap-2">
        <Link to="/articles">
          <Button variant="secondary">Browse articles</Button>
        </Link>
        <Link to="/pricing">
          <Button>Back to plans</Button>
        </Link>
      </div>
    </div>
  );
}
