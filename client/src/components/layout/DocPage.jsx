import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Shared layout for static content pages (About, Terms, Privacy, etc.).
 * Renders a centered, editorial reading column with warm typography that
 * matches the article reading experience.
 */
export function DocPage({ eyebrow, title, intro, updated, children }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-radial-fade" />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
        >
          <ArrowLeft size={14} />
          Back home
        </Link>

        <header className="mt-6 border-b border-slate-200 pb-8 dark:border-slate-800">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance sm:text-4xl dark:text-slate-50">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 text-lg leading-7 text-slate-600 text-pretty dark:text-slate-300">
              {intro}
            </p>
          )}
          {updated && (
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Last updated {updated}
            </p>
          )}
        </header>

        <div
          className="prose prose-slate mt-10 max-w-none dark:prose-invert
            prose-headings:font-display prose-headings:tracking-tight
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
            prose-h3:text-base prose-h3:mt-6
            prose-p:leading-7 prose-li:leading-7
            prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
            dark:prose-a:text-brand-300
            prose-strong:text-slate-900 dark:prose-strong:text-slate-100"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
