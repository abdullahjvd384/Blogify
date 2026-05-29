import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, Clock, ArrowRight, Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCountdown } from '@/lib/useCountdown';
import { cn } from '@/lib/cn';

const PERKS = [
  'Unlimited member-only stories',
  'Directly support the writers you read',
  'Cancel anytime',
];

export function PaywallModal({ open, onClose, usage }) {
  const reset = useCountdown(usage?.resetAt);

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

  const used = usage?.used;
  const limit = usage?.limit;

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
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="relative isolate overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20 mix-blend-overlay" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ring-1 ring-inset ring-white/20 backdrop-blur-sm">
            <Crown size={11} />
            Member-only story
          </span>
          <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-balance">
            You&apos;ve used your free member stories
          </h2>
          <p className="mt-1.5 text-sm text-white/90">
            {used !== undefined && limit !== undefined ? (
              <>
                You&apos;ve read{' '}
                <span className="font-semibold">
                  {used}/{limit}
                </span>{' '}
                free member-only stories this month. Become a member to keep reading — and to
                support the writers you love.
              </>
            ) : (
              <>Become a member to read this story and support the writers you love.</>
            )}
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-800/40">
            <Clock size={14} className="text-slate-500" />
            <span className="text-slate-600 dark:text-slate-300">Free reads reset in</span>
            <span className="ml-auto rounded-md bg-white px-2 py-0.5 font-mono text-xs font-medium text-slate-800 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700">
              {reset}
            </span>
          </div>

          <ul className="mt-5 space-y-2">
            {PERKS.map((perk) => (
              <li key={perk} className={cn('flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300')}>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Check size={12} />
                </span>
                {perk}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Maybe later
            </Button>
            <Link to="/pricing" onClick={onClose}>
              <Button leftIcon={<Sparkles />} rightIcon={<ArrowRight />}>
                Become a member
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
