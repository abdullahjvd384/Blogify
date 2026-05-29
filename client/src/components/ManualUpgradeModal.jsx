import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { X, Copy, Check, Phone, Hash, Wallet, ArrowRight } from 'lucide-react';
import { usePaymentInfo, useSubmitManualPayment } from '@/features/payments/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { readApiError } from '@/lib/apiError';

const schema = z.object({
  txnRefNo: z.string().trim().min(4, 'Transaction ID must be at least 4 characters').max(40),
  senderPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{8,20}$/, 'Enter a valid phone number'),
  note: z.string().trim().max(280).optional(),
});

function priceForCycle(plan, billingCycle) {
  if (!plan) return 0;
  return billingCycle === 'annual' ? plan.pricePaisaAnnual : plan.pricePaisaMonthly;
}

export function ManualUpgradeModal({ open, plan, billingCycle = 'monthly', onClose, onSubmitted }) {
  const info = usePaymentInfo();
  const submit = useSubmitManualPayment();
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { txnRefNo: '', senderPhone: '', note: '' },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  if (!open || !plan) return null;

  const receiver = info.data?.receiver;
  const amountPaisa = priceForCycle(plan, billingCycle);
  const amountLabel = `PKR ${(amountPaisa / 100).toLocaleString()}`;

  async function copyNumber() {
    if (!receiver?.number) return;
    try {
      await navigator.clipboard.writeText(receiver.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed — please copy manually');
    }
  }

  async function onSave(values) {
    try {
      const payment = await submit.mutateAsync({ ...values, planKey: plan.key, billingCycle });
      toast.success('Submitted — admin will verify shortly');
      onSubmitted?.(payment);
      onClose();
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={16} />
        </button>

        <div className="border-b border-slate-200 bg-gradient-to-br from-brand-50 to-accent-50 px-6 py-5 dark:border-slate-800 dark:from-brand-950/40 dark:to-accent-950/40">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-brand-600 dark:text-brand-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-200">
              Manual JazzCash upgrade
            </span>
          </div>
          <h2 className="mt-2 font-display text-xl font-bold text-slate-900 dark:text-slate-50">
            {plan.label} — {amountLabel}/{billingCycle === 'annual' ? 'yr' : 'mo'}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Send the exact amount to our JazzCash account, then submit the Transaction ID below. An
            admin verifies it and activates your plan (usually within a few hours).
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Send {amountLabel} to JazzCash
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div>
                <div className="font-mono text-lg font-bold tracking-wider text-slate-900 dark:text-slate-50">
                  {info.isLoading ? '…' : receiver?.number || '—'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {receiver?.name || ''}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={copied ? <Check /> : <Copy />}
                onClick={copyNumber}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <ol className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>1. Open the JazzCash app → "Mobile Account Transfer"</li>
              <li>2. Send the exact amount above to the number shown</li>
              <li>3. Copy the Transaction ID from the success screen</li>
              <li>4. Paste it below and submit</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
            <Field label="JazzCash Transaction ID" htmlFor="txnRefNo" error={errors.txnRefNo?.message}>
              <Input
                id="txnRefNo"
                placeholder="e.g. 1234567890"
                leftIcon={<Hash />}
                error={!!errors.txnRefNo}
                {...register('txnRefNo')}
              />
            </Field>
            <Field
              label="Sender phone number"
              htmlFor="senderPhone"
              error={errors.senderPhone?.message}
            >
              <Input
                id="senderPhone"
                placeholder="03XX-XXXXXXX"
                leftIcon={<Phone />}
                error={!!errors.senderPhone}
                {...register('senderPhone')}
              />
            </Field>
            <Field label="Note (optional)" htmlFor="note" error={errors.note?.message}>
              <textarea
                id="note"
                rows={2}
                placeholder="Anything we should know? (e.g. paid at 6pm)"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
                {...register('note')}
              />
            </Field>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" rightIcon={<ArrowRight />} isLoading={submit.isPending}>
                Submit for review
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already submitted?{' '}
              <Link to="/account/subscription" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
                Check status
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
