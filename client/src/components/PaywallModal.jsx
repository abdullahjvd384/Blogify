import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useCountdown } from '@/lib/useCountdown';
import { usePlans } from '@/features/subscription/hooks';

/**
 * Shown when a free reader hits their daily limit, or proactively as a
 * pre-emptive nudge (Day 11+ flow). Renders a countdown to the next reset
 * and a list of upgrade options with prices in PKR.
 */
export function PaywallModal({ open, onClose, usage }) {
  const reset = useCountdown(usage?.resetAt);
  const { data: plans } = usePlans();
  const upgrades = (plans || []).filter((p) => p.key !== 'free' && p.key !== usage?.plan);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold tracking-tight">You hit today&apos;s limit</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Your <span className="font-medium capitalize">{usage?.plan || 'free'}</span> plan
          includes <span className="font-medium">{usage?.limit ?? '—'}</span> articles per day.
          {usage?.used !== undefined && usage?.used !== null && (
            <>
              {' '}
              You&apos;ve read{' '}
              <span className="font-medium">
                {usage.used}/{usage.limit}
              </span>{' '}
              today.
            </>
          )}
        </p>

        <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
          Resets in <span className="font-mono font-medium">{reset}</span>
        </div>

        {upgrades.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Upgrade for more
            </p>
            <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {upgrades.map((p) => (
                <li
                  key={p.key}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{p.label}</span>
                    <span className="ml-2 text-slate-500">
                      {p.dailyLimit === null ? 'unlimited' : `${p.dailyLimit}/day`}
                    </span>
                  </span>
                  <span className="font-medium">
                    {p.pricePaisa === 0
                      ? 'Free'
                      : `Rs ${(p.pricePaisa / 100).toLocaleString()}/mo`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Maybe later
          </Button>
          <Link to="/pricing" onClick={onClose}>
            <Button>See plans</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
