import { ExternalLink, Megaphone } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ADS_ENABLED } from '@/lib/ads';

// ─── Adsterra Direct Link ("Smart Link") ──────────────────────────────
// A single monetization URL: Adsterra redirects each visitor to the best-paying
// offer for them. Kept here as ONE source of truth so every placement points at
// the same zone — change it in one spot.
//
// Policy note: it is always rendered as a clearly-labeled "Sponsored" link with
// rel="sponsored". We deliberately do NOT disguise it as site navigation, wrap
// it around real content, or auto-redirect — those tricks violate Adsterra's
// terms and get accounts banned (which would earn you nothing).
export const DIRECT_LINK =
  'https://www.effectivecpmnetwork.com/eped8ihs?key=b1a79ae1788478985d5c6a782735d13c';

/** Small inline "Sponsored" text link — for footers, byline rows, etc. */
export function SponsoredTextLink({ className, children = 'Sponsored' }) {
  if (!ADS_ENABLED) return null;
  return (
    <a
      href={DIRECT_LINK}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

/** Card-shaped sponsored unit that slots into an ArticleCard grid. */
export function SponsoredCard({ className }) {
  if (!ADS_ENABLED) return null;
  return (
    <a
      href={DIRECT_LINK}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={cn(
        'group flex flex-col justify-between rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lift dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:border-amber-700',
        className,
      )}
    >
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
        <Megaphone size={11} /> Sponsored
      </span>
      <div className="mt-4">
        <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Recommended for you
        </h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Handpicked offers, tools, and deals from our partners — see what&apos;s
          trending today.
        </p>
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
        Check it out
        <ExternalLink size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}

/** Wide in-article sponsored callout (full content width). */
export function SponsoredBanner({ className }) {
  if (!ADS_ENABLED) return null;
  return (
    <a
      href={DIRECT_LINK}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={cn(
        'group flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-5 transition hover:border-amber-400 hover:bg-amber-50 sm:flex-row sm:items-center dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:bg-amber-950/40',
        className,
      )}
    >
      <div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <Megaphone size={11} /> Sponsored
        </span>
        <p className="mt-2 font-semibold text-slate-900 dark:text-slate-50">
          Explore top picks from our partners
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Deals, tools, and offers matched to readers like you.
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-amber-600">
        View offer
        <ExternalLink size={14} />
      </span>
    </a>
  );
}
