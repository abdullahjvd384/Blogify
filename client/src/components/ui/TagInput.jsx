import { useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Lightweight tag input. Caller owns the array; we just wire up Enter/comma to
 * push and Backspace-on-empty to pop. Tags are normalized to lowercase before
 * being added to match the server's `tagsSchema`.
 */
export function TagInput({ value = [], onChange, max = 8, placeholder = 'Add a tag…' }) {
  const [draft, setDraft] = useState('');

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

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm',
        'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500',
        'dark:border-slate-700 dark:bg-slate-900',
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft && add(draft)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-[8rem] flex-1 bg-transparent py-0.5 text-sm outline-none"
      />
    </div>
  );
}
