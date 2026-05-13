import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { cn } from '@/lib/cn';

export function VoteButtons({
  upvotes = 0,
  downvotes = 0,
  myVote = 0,
  onVote,
  disabled = false,
  isPending = false,
  size = 'md',
}) {
  const score = upvotes - downvotes;

  function click(value) {
    if (disabled || isPending) return;
    onVote?.(myVote === value ? 0 : value);
  }

  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 16 : 19;

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1 py-0.5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => click(1)}
        disabled={disabled || isPending}
        title={disabled ? 'Sign in to vote' : 'Upvote'}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-all',
          buttonSize,
          'disabled:cursor-not-allowed disabled:opacity-50',
          myVote === 1
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300',
        )}
        aria-label="Upvote"
        aria-pressed={myVote === 1}
      >
        <ArrowBigUp size={iconSize} fill={myVote === 1 ? 'currentColor' : 'none'} />
      </button>
      <span
        className={cn(
          'min-w-[2.25ch] px-1 text-center text-sm font-semibold tabular-nums',
          score > 0 && 'text-emerald-600 dark:text-emerald-400',
          score < 0 && 'text-rose-600 dark:text-rose-400',
          score === 0 && 'text-slate-500 dark:text-slate-400',
        )}
      >
        {score}
      </span>
      <button
        type="button"
        onClick={() => click(-1)}
        disabled={disabled || isPending}
        title={disabled ? 'Sign in to vote' : 'Downvote'}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-all',
          buttonSize,
          'disabled:cursor-not-allowed disabled:opacity-50',
          myVote === -1
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
            : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300',
        )}
        aria-label="Downvote"
        aria-pressed={myVote === -1}
      >
        <ArrowBigDown size={iconSize} fill={myVote === -1 ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
