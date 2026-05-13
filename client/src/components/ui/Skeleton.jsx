import { cn } from '@/lib/cn';

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-md', className)} />;
}

export function ArticleCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-5 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
