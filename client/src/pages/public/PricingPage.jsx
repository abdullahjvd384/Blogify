import { Link } from 'react-router-dom';
import { usePlans, useMySubscription } from '@/features/subscription/hooks';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export default function PricingPage() {
  const user = useAuthStore((s) => s.user);
  const { data: plans, isLoading } = usePlans();
  const { data: mySub } = useMySubscription();
  const currentKey = mySub?.subscription?.plan;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Plans</h1>
        <p className="mt-2 text-sm text-slate-500">
          Pay once a month, read without thinking about it.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {plans?.map((plan) => {
          const isCurrent = currentKey === plan.key;
          return (
            <div
              key={plan.key}
              className={cn(
                'flex flex-col rounded-lg border p-5 transition-colors',
                isCurrent
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-600/10'
                  : 'border-slate-200 dark:border-slate-800',
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{plan.label}</h2>
                {isCurrent && (
                  <span className="rounded bg-brand-600 px-2 py-0.5 text-xs text-white">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold">
                {plan.pricePaisa === 0 ? (
                  'Free'
                ) : (
                  <>
                    Rs {(plan.pricePaisa / 100).toLocaleString()}
                    <span className="text-sm font-normal text-slate-500">/mo</span>
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {plan.dailyLimit === null
                  ? 'Unlimited articles per day'
                  : `${plan.dailyLimit} articles per day`}
              </p>
              <div className="mt-auto pt-5">
                {plan.pricePaisa === 0 ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Default plan
                  </Button>
                ) : isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Active
                  </Button>
                ) : (
                  <Button className="w-full" disabled title="Payments launching soon">
                    Coming soon
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!user && (
        <p className="mt-10 text-center text-sm text-slate-500">
          <Link to="/signup" className="font-medium text-brand-600 hover:underline">
            Create an account
          </Link>{' '}
          to start reading.
        </p>
      )}
    </div>
  );
}
