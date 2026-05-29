import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Sparkles, Crown, ArrowRight, ShieldCheck, Heart, BookOpen } from 'lucide-react';
import { MEMBERSHIP } from '@blogplatform/shared';
import { usePlans, useMySubscription } from '@/features/subscription/hooks';
import { useAuthStore } from '@/stores/authStore';
import { ManualUpgradeModal } from '@/components/ManualUpgradeModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

const FREE_PERKS = [
  'Read every free story, always',
  `${MEMBERSHIP.FREE_METER_PER_MONTH} member-only stories each month`,
  'Follow writers and topics',
  'Vote, respond, and bookmark',
];

const MEMBER_PERKS = [
  'Unlimited member-only stories',
  'Directly support the writers you read',
  'A member badge on your profile',
  'Cancel anytime',
];

const FACTS = [
  { icon: ShieldCheck, label: 'AI-moderated quality on every story' },
  { icon: Heart, label: 'Half of membership revenue goes to writers' },
  { icon: Sparkles, label: 'Cancel anytime, no questions asked' },
];

function rs(paisa) {
  return `Rs ${(paisa / 100).toLocaleString()}`;
}

export default function PricingPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: plans } = usePlans();
  const { data: mySub } = useMySubscription();
  const [cycle, setCycle] = useState('monthly');
  const [open, setOpen] = useState(false);

  const memberPlan = useMemo(() => (plans || []).find((p) => p.key === 'member'), [plans]);
  const isMember = mySub?.isMember;
  const price = cycle === 'annual' ? memberPlan?.pricePaisaAnnual : memberPlan?.pricePaisaMonthly;
  const monthly = memberPlan?.pricePaisaMonthly || 0;
  const annualMonthlyEquivalent = memberPlan ? memberPlan.pricePaisaAnnual / 12 : 0;
  const annualSavingPct = monthly ? Math.round((1 - annualMonthlyEquivalent / monthly) * 100) : 0;

  function onJoin() {
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    setOpen(true);
  }

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-fade" />
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="brand" leftIcon={<Sparkles />}>Membership</Badge>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-900 text-balance sm:text-5xl dark:text-slate-50">
            Read freely. <span className="gradient-text">Pay writers</span> for the best work.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">
            Most stories are free. Become a member to unlock every member-only story — and put
            money directly in the pockets of the writers you read.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-10 flex items-center justify-center">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            {['monthly', 'annual'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={cn(
                  'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition',
                  cycle === c
                    ? 'bg-white text-slate-900 shadow-soft dark:bg-slate-800 dark:text-slate-50'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                )}
              >
                {c}
                {c === 'annual' && annualSavingPct > 0 && (
                  <span className="ml-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    save {annualSavingPct}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-lift">
              <BookOpen size={20} />
            </div>
            <h2 className="mt-5 font-display text-xl font-bold text-slate-900 dark:text-slate-50">Free</h2>
            <div className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Rs 0
            </div>
            <ul className="mt-6 space-y-2.5 text-sm">
              {FREE_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-7">
              <Button variant="secondary" className="w-full" disabled>
                {isMember ? 'Included' : 'Your plan'}
              </Button>
            </div>
          </div>

          {/* Member */}
          <div className="relative flex flex-col rounded-2xl border border-brand-300 bg-white p-6 shadow-lift dark:border-brand-700 dark:bg-slate-900/60">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-lift">
                <Crown size={11} /> Member
              </span>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-lift">
              <Crown size={20} />
            </div>
            <h2 className="mt-5 font-display text-xl font-bold text-slate-900 dark:text-slate-50">Member</h2>
            <div className="mt-3 flex items-end gap-1">
              <span className="font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {price !== undefined ? rs(price) : '—'}
              </span>
              <span className="mb-1 text-sm text-slate-500 dark:text-slate-400">
                /{cycle === 'annual' ? 'yr' : 'mo'}
              </span>
            </div>
            {cycle === 'annual' && monthly > 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                That&apos;s just {rs(Math.round(annualMonthlyEquivalent))}/mo, billed yearly.
              </p>
            )}
            <ul className="mt-6 space-y-2.5 text-sm">
              {MEMBER_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-7">
              {isMember ? (
                <Button variant="secondary" className="w-full" disabled leftIcon={<Check />}>
                  Active
                </Button>
              ) : (
                <Button className="w-full" onClick={onJoin} rightIcon={<ArrowRight />}>
                  Become a member
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FACTS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-700 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                <Icon size={16} />
              </span>
              {label}
            </div>
          ))}
        </div>

        {!user && (
          <p className="mt-12 text-center text-sm text-slate-600 dark:text-slate-400">
            <Link to="/signup" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
              Create a free account
            </Link>{' '}
            to start reading.
          </p>
        )}
      </div>

      <ManualUpgradeModal
        open={open}
        plan={memberPlan}
        billingCycle={cycle}
        onClose={() => setOpen(false)}
        onSubmitted={() => navigate('/account/subscription')}
      />
    </div>
  );
}
