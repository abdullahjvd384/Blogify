import { cn } from '@/lib/cn';

const STYLES = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  needs_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  unpublished: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  removed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

const LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In review',
  needs_review: 'Needs review',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
  unpublished: 'Unpublished',
  removed: 'Removed',
};

export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        STYLES[status] || STYLES.draft,
        className,
      )}
    >
      {LABELS[status] || status}
    </span>
  );
}
