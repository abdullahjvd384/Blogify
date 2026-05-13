import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  ShieldCheck,
  Headphones,
  BookOpen,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { usePlans, useMySubscription } from '@/features/subscription/hooks';
import { useCheckout } from '@/features/payments/hooks';
import { submitToGateway } from '@/features/payments/submitForm';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { readApiError } from '@/lib/apiError';
import { cn } from '@/lib/cn';

const PLAN_STYLES = {
  free: {
    icon: BookOpen,
    accent: 'from-slate-500 to-slate-700',
    border: 'border-slate-200 dark:border-slate-800',
    perks: [
      'Read up to 3 articles per day',
      'Browse the full public feed',
      'Vote and bookmark articles',
      'Dark mode and quiet UI',
    ],
  },
  pro: {
    icon: Zap,
    accent: 'from-brand-500 to-accent-500',
    border: 'border-brand-300 dark:border-brand-700',
    perks: [
      'Up to 50 articles per day',
      'Priority moderation queue',
      'Advanced reading analytics',
      'Save unlimited bookmarks',
    ],
  },
  premium: {
    icon: Crown,
    accent: 'from-amber-500 to-rose-500',
    border: 'border-amber-300 dark:border-amber-700',
    perks: [
      'Unlimited daily reads',
      'Premium-only collections',
      'Early access to new features',
      'Priority support',
    ],
  },
};

const SUPPORT_FACTS = [
  { icon: ShieldCheck, label: 'AI-moderated quality on every plan' },
  { icon: Headphones, label: 'Email support within 24h' },
  { icon: Sparkles, label: 'Cancel anytime, no questions asked' },
];

export default function PricingPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: plans, isLoading } = usePlans();
  const { data: mySub } = useMySubscription();
  const checkout = useCheckout();
  const currentKey = mySub?.subscription?.plan;

  async function onUpgrade(planKey) {
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    try {
      const { formUrl, fields } = await checkout.mutateAsync(planKey);
      submitToGateway(formUrl, fields);
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  const featuredKey = plans?.find((p) => p.key === 'pro')?.key || plans?.[1]?.key;

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-fade" />
      <div className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-96 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 animate-blob rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-700/30" />
        <div className="absolute right-1/3 top-10 h-72 w-72 animate-blob rounded-full bg-accent-400/20 blur-3xl dark:bg-accent-700/30" style={{ animationDelay: '-6s' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="brand" leftIcon={<Sparkles />}>Pricing</Badge>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-900 text-balance sm:text-5xl dark:text-slate-50">
            Pay once a month, <span className="gradient-text">read without thinking</span> about it.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">
            Pick a plan that matches your appetite. Upgrade or downgrade any time.
            Sandbox mode — no real money will be charged.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="mt-4 h-10 w-32" />
                <div className="mt-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-3 w-full" />
                  ))}
                </div>
              </div>
            ))}

          {plans?.map((plan) => {
            const isCurrent = currentKey === plan.key;
            const isUpgradePending =
              checkout.isPending && checkout.variables === plan.key;
            const isFeatured = plan.key === featuredKey && !isCurrent;
            const style = PLAN_STYLES[plan.key] || PLAN_STYLES.free;
            const Icon = style.icon;
            const unlimited = plan.dailyLimit === null;

            return (
              <div
                key={plan.key}
                className={cn(
                  'group relative flex flex-col rounded-2xl border bg-white p-6 shadow-soft transition-all duration-300',
                  'dark:bg-slate-900/60',
                  isCurrent
                    ? 'border-brand-400 ring-2 ring-brand-400/50 dark:border-brand-600'
                    : isFeatured
                    ? 'border-brand-300 shadow-lift dark:border-brand-700'
                    : style.border,
                  'hover:-translate-y-0.5 hover:shadow-lift',
                )}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-brand-600 to-accent-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-lift">
                      <Sparkles size={11} /> Most popular
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-lift">
                      <Check size={11} /> Current plan
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lift', style.accent)}>
                    <Icon size={20} />
                  </div>
                </div>

                <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {plan.label}
                </h2>

                <div className="mt-3 flex items-end gap-1">
                  {plan.pricePaisa === 0 ? (
                    <span className="font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      Free
                    </span>
                  ) : (
                    <>
                      <span className="font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Rs {(plan.pricePaisa / 100).toLocaleString()}
                      </span>
                      <span className="mb-1 text-sm text-slate-500 dark:text-slate-400">/mo</span>
                    </>
                  )}
                </div>

                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  {unlimited ? (
                    <>
                      <InfinityIcon size={14} className="text-brand-500" />
                      Unlimited articles per day
                    </>
                  ) : (
                    <>
                      <Zap size={14} className="text-brand-500" />
                      {plan.dailyLimit} articles per day
                    </>
                  )}
                </p>

                <ul className="mt-6 space-y-2.5 text-sm">
                  {style.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                      <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  {plan.pricePaisa === 0 ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Default plan
                    </Button>
                  ) : isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled leftIcon={<Check />}>
                      Active
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isFeatured ? 'primary' : 'outline'}
                      onClick={() => onUpgrade(plan.key)}
                      isLoading={isUpgradePending}
                      rightIcon={<ArrowRight />}
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Support facts */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SUPPORT_FACTS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-700 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                <Icon size={16} />
              </span>
              {label}
            </div>
          ))}
        </div>

        {/* FAQ teaser */}
        <div className="mt-20 rounded-3xl border border-slate-200 bg-white/60 p-8 text-center backdrop-blur dark:border-slate-800 dark:bg-slate-900/40 sm:p-12">
          <h3 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Questions? We have answers.
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Plans renew monthly via JazzCash sandbox. You can change or cancel at any
            time — your existing reads always stay available.
          </p>
          {!user && (
            <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
              <Link to="/signup" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
                Create an account
              </Link>{' '}
              to start reading on the Free plan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
