import { cn } from '@/lib/cn';

export function Logo({ className, withText = true, size = 'md' }) {
  const dims = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const text = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden rounded-xl',
          'bg-gradient-to-br from-brand-500 via-brand-600 to-accent-500 text-white shadow-lift',
          dims,
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-1/2 w-1/2"
          aria-hidden
        >
          <path
            d="M9 7.5 4.5 12 9 16.5M15 7.5 19.5 12 15 16.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/15 to-white/0" />
      </span>
      {withText && (
        <span className={cn('font-display font-bold tracking-tight text-slate-900 dark:text-slate-50', text)}>
          Dev<span className="gradient-text">Crunch</span>
        </span>
      )}
    </span>
  );
}
