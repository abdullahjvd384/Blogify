import { cn } from '@/lib/cn';

export function Field({ label, htmlFor, error, hint, className, action, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || action) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={htmlFor}
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {label}
            </label>
          )}
          {action}
        </div>
      )}
      {children}
      {error ? (
        <p className="flex items-start gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <span aria-hidden className="mt-px">•</span>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
