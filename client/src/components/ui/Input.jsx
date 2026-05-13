import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef(function Input(
  { className, error, leftIcon, rightIcon, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {leftIcon ? (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 [&>svg]:h-4 [&>svg]:w-4">
          {leftIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        className={cn(
          'block w-full rounded-lg border bg-white text-sm shadow-soft transition-all duration-200',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-4',
          'dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500',
          'h-11 px-3.5 py-2',
          leftIcon && 'pl-9',
          rightIcon && 'pr-9',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/70'
            : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/15 dark:border-slate-800 dark:focus:border-brand-400',
          className,
        )}
        {...rest}
      />
      {rightIcon ? (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 [&>svg]:h-4 [&>svg]:w-4">
          {rightIcon}
        </span>
      ) : null}
    </div>
  );
});
