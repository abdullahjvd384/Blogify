import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef(function Input(
  { className, error, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
        'dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500',
        error
          ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
          : 'border-slate-300 dark:border-slate-700',
        className,
      )}
      {...rest}
    />
  );
});
