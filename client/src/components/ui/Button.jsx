import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary: [
    'bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-lift',
    'hover:from-brand-500 hover:to-brand-700 hover:shadow-glow',
    'active:from-brand-700 active:to-brand-800',
    'disabled:from-brand-500/60 disabled:to-brand-600/60 disabled:shadow-none',
  ].join(' '),
  secondary: [
    'bg-white text-slate-900 ring-1 ring-inset ring-slate-200 shadow-soft',
    'hover:bg-slate-50 hover:ring-slate-300',
    'dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800 dark:hover:bg-slate-800',
  ].join(' '),
  outline: [
    'bg-transparent text-brand-700 ring-1 ring-inset ring-brand-300/70',
    'hover:bg-brand-50 hover:ring-brand-400',
    'dark:text-brand-300 dark:ring-brand-700/60 dark:hover:bg-brand-950/60',
  ].join(' '),
  ghost: [
    'bg-transparent text-slate-700 hover:bg-slate-100',
    'dark:text-slate-300 dark:hover:bg-slate-800/80',
  ].join(' '),
  danger: [
    'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lift',
    'hover:from-red-500 hover:to-red-700',
    'disabled:from-red-500/60 disabled:to-red-600/60 disabled:shadow-none',
  ].join(' '),
};

const SIZES = {
  xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-5 text-sm rounded-lg gap-2',
  lg: 'h-12 px-7 text-base rounded-xl gap-2',
  xl: 'h-14 px-8 text-base rounded-xl gap-2.5',
};

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    className,
    type = 'button',
    isLoading = false,
    leftIcon = null,
    rightIcon = null,
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const showShine = variant === 'primary' || variant === 'danger';
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'group relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium tracking-tight',
        'transition-all duration-200 ease-out will-change-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-offset-slate-950',
        'disabled:cursor-not-allowed disabled:opacity-90',
        showShine && 'btn-shine',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="opacity-90">Please wait</span>
        </>
      ) : (
        <>
          {leftIcon ? (
            <span className="inline-flex shrink-0 [&>svg]:h-4 [&>svg]:w-4">{leftIcon}</span>
          ) : null}
          <span>{children}</span>
          {rightIcon ? (
            <span className="inline-flex shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 [&>svg]:h-4 [&>svg]:w-4">
              {rightIcon}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
});
