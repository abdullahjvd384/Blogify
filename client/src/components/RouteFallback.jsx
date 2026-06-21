/** Lightweight loading state shown while a lazily-loaded route chunk downloads. */
export function RouteFallback() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center" role="status" aria-label="Loading">
      <span className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400" />
    </div>
  );
}
