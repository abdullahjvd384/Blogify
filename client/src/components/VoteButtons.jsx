import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Up/down vote toggle. Clicking the active direction clears the vote (sends 0);
 * clicking the other side flips. Anonymous users see a disabled control with a
 * "sign in" tooltip.
 */
export function VoteButtons({
  upvotes = 0,
  downvotes = 0,
  myVote = 0,
  onVote,
  disabled = false,
  isPending = false,
}) {
  const score = upvotes - downvotes;

  function click(value) {
    if (disabled || isPending) return;
    onVote?.(myVote === value ? 0 : value);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => click(1)}
        disabled={disabled || isPending}
        title={disabled ? 'Sign in to vote' : 'Upvote'}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          myVote === 1
            ? 'text-emerald-600'
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
        )}
        aria-label="Upvote"
        aria-pressed={myVote === 1}
      >
        <ArrowBigUp size={20} fill={myVote === 1 ? 'currentColor' : 'none'} />
      </button>
      <span
        className={cn(
          'min-w-[2ch] text-center text-sm font-medium tabular-nums',
          score > 0 && 'text-emerald-600',
          score < 0 && 'text-red-600',
          score === 0 && 'text-slate-500',
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
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          myVote === -1
            ? 'text-red-600'
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
        )}
        aria-label="Downvote"
        aria-pressed={myVote === -1}
      >
        <ArrowBigDown size={20} fill={myVote === -1 ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
