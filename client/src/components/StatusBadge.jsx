import {
  FileText,
  Send,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Archive,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const STYLES = {
  draft:
    'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:ring-slate-700',
  submitted:
    'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-800',
  in_review:
    'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800',
  needs_review:
    'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800',
  approved:
    'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800',
  published:
    'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800',
  rejected:
    'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:ring-rose-800',
  unpublished:
    'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700',
  removed:
    'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:ring-rose-800',
};

const ICONS = {
  draft: FileText,
  submitted: Send,
  in_review: Eye,
  needs_review: AlertTriangle,
  approved: CheckCircle2,
  published: CheckCircle2,
  rejected: XCircle,
  unpublished: Archive,
  removed: Trash2,
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
  const Icon = ICONS[status] || FileText;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        STYLES[status] || STYLES.draft,
        className,
      )}
    >
      <Icon size={11} />
      {LABELS[status] || status}
    </span>
  );
}
