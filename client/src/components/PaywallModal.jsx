import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, Clock, ArrowRight, Crown, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCountdown } from '@/lib/useCountdown';
import { usePlans } from '@/features/subscription/hooks';
import { cn } from '@/lib/cn';

const PLAN_ICONS = {
  basic: Star,
  pro: Zap,
  god_tier: Crown,
};

export function PaywallModal({ open, onClose, usage }) {
  const reset = useCountdown(usage?.resetAt);
  const { data: plans } = usePlans();
  const upgrades = (plans || []).filter((p) => p.key !== 'free' && p.key !== usage?.plan);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in-fast"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card animate-slide-down dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <X size={16} />
        </button>

        <div className="relative isolate overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 p-6 text-white">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20 mix-blend-overlay" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ring-1 ring-inset ring-white/20 backdrop-blur-sm">
            <Sparkles size={11} />
            Upgrade
          </span>
          <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-balance">
            You hit today&apos;s reading limit
          </h2>
          <p className="mt-1.5 text-sm text-brand-50/90">
            Your <span className="font-semibold capitalize">{usage?.plan || 'free'}</span> plan
            includes <span className="font-semibold">{usage?.limit ?? '—'}</span> articles per day.
            {usage?.used !== undefined && usage?.used !== null && (
              <>
                {' '}You&apos;ve read{' '}
                <span className="font-semibold">
                  {usage.used}/{usage.limit}
                </span>{' '}today.
              </>
            )}
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-800/40">
            <Clock size={14} className="text-slate-500" />
            <span className="text-slate-600 dark:text-slate-300">Resets in</span>
            <span className="ml-auto rounded-md bg-white px-2 py-0.5 font-mono text-xs font-medium text-slate-800 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700">
              {reset}
            </span>
          </div>

          {upgrades.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Upgrade for more
              </p>
              <ul className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                {upgrades.map((p, idx) => {
                  const Icon = PLAN_ICONS[p.key] || Zap;
                  return (
                    <li
                      key={p.key}
                      className={cn(
                        'flex items-center justify-between gap-3 px-4 py-3 text-sm',
                        idx > 0 && 'border-t border-slate-200 dark:border-slate-800',
                        'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60',
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                          <Icon size={15} />
                        </span>
                        <span>
                          <span className="block font-semibold text-slate-900 dark:text-slate-100">
                            {p.label}
                          </span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">
                            {p.dailyLimit === null ? 'Unlimited reads' : `${p.dailyLimit} reads / day`}
                          </span>
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-semibold text-slate-900 dark:text-slate-50">
                          {p.pricePaisa === 0
                            ? 'Free'
                            : `Rs ${(p.pricePaisa / 100).toLocaleString()}`}
                        </span>
                        {p.pricePaisa !== 0 && (
                          <span className="text-[10px] text-slate-500">per month</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Maybe later
            </Button>
            <Link to="/pricing" onClick={onClose}>
              <Button rightIcon={<ArrowRight />}>See plans</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
