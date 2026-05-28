import { cn } from '@/lib/cn';
import { initialsFor } from '@/lib/profile';

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

/** Renders a user's avatar image, falling back to gradient initials. */
export function Avatar({ user, size = 'md', className }) {
  const name = user?.name || user?.email || 'Anonymous';
  const url = user?.avatarUrl;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-accent-500 font-semibold text-white shadow-soft',
        SIZES[size],
        className,
      )}
      aria-hidden
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initialsFor(name)
      )}
    </span>
  );
}
