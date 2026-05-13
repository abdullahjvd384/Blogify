import { useState } from 'react';
import { X, Hash } from 'lucide-react';
import { cn } from '@/lib/cn';

export function TagInput({ value = [], onChange, max = 8, placeholder = 'Add a tag and press Enter…' }) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);

  function add(raw) {
    const tag = raw.trim().toLowerCase();
    if (!tag || tag.length > 40) return;
    if (value.includes(tag)) return;
    if (value.length >= max) return;
    onChange?.([...value, tag]);
    setDraft('');
  }

  function remove(tag) {
    onChange?.(value.filter((t) => t !== tag));
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      remove(value[value.length - 1]);
    }
  }

  const atLimit = value.length >= max;

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          'flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 text-sm shadow-soft transition-all duration-200',
          'dark:bg-slate-900/70',
          focused
            ? 'border-brand-500 ring-4 ring-brand-500/15 dark:border-brand-400'
            : 'border-slate-200 dark:border-slate-800',
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="group inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200/70 dark:bg-brand-950/60 dark:text-brand-200 dark:ring-brand-800/60"
          >
            <Hash size={11} className="opacity-70" />
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-brand-500/70 hover:bg-brand-100 hover:text-brand-800 dark:hover:bg-brand-900/80 dark:hover:text-brand-100"
              aria-label={`Remove ${tag}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (draft) add(draft);
          }}
          placeholder={value.length === 0 ? placeholder : atLimit ? '' : 'Add another…'}
          disabled={atLimit}
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
      <p className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Press Enter or comma to add.</span>
        <span className={cn('tabular-nums', atLimit && 'text-amber-600 dark:text-amber-400')}>
          {value.length}/{max}
        </span>
      </p>
    </div>
  );
}
