import { cn } from '@/lib/cn';

const VARIANTS = {
  default:
    'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-800/80 dark:text-slate-200 dark:ring-slate-700/80',
  brand:
    'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/80 dark:bg-brand-950/60 dark:text-brand-200 dark:ring-brand-800/60',
  accent:
    'bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200/80 dark:bg-accent-950/60 dark:text-accent-200 dark:ring-accent-800/60',
  success:
    'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800/60',
  warning:
    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800/60',
  outline:
    'bg-white/40 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700',
};

export function Badge({ variant = 'default', className, children, leftIcon }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className,
      )}
    >
      {leftIcon ? <span className="-ml-0.5 [&>svg]:h-3 [&>svg]:w-3">{leftIcon}</span> : null}
      {children}
    </span>
  );
}
