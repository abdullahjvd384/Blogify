import { cn } from '@/lib/cn';

/**
 * Form field shell — renders label, the wrapped input, and error/helper text.
 * Pass `error` from React Hook Form's `formState.errors[name]?.message`.
 */
export function Field({ label, htmlFor, error, hint, className, children }) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
