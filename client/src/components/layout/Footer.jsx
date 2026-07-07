import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { SponsoredTextLink } from '@/components/SponsoredLink';

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'Read articles', to: '/articles' },
      { label: 'Pricing & membership', to: '/pricing' },
      { label: 'Search', to: '/search' },
    ],
  },
  {
    title: 'Write',
    links: [
      { label: 'Start writing', to: '/signup' },
      { label: 'Editorial guidelines', to: '/guidelines' },
      { label: 'Writer studio', to: '/writer' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Help center', to: '/help' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of service', to: '/terms' },
      { label: 'Privacy policy', to: '/privacy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-900/40 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="max-w-md">
            <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              The DevCrunch brief
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              The sharpest stories on AI, startups, and security — in your inbox. No spam, unsubscribe anytime.
            </p>
          </div>
          <NewsletterSignup source="footer" className="md:w-auto" />
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Logo size="lg" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-400">
              Sharp takes on AI, startups, and security — for people who build.
              Free to read, member-supported, and built to pay writers.
            </p>
            <a
              href="mailto:support@devcrunch.tech"
              aria-label="Email support"
              className="mt-5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:ring-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <Mail size={16} />
            </a>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-600 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} DevCrunch. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Adsterra direct link (smart link) — labeled per ad-network policy. */}
            <SponsoredTextLink className="text-xs text-slate-400 transition-colors hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand-300" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tech that matters, written by people who ship.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
