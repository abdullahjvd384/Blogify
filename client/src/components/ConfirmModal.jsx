import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Generic confirm dialog. Replaces window.confirm / window.prompt with a
 * styled in-app modal.
 *
 * Props:
 *  - open
 *  - title, description
 *  - icon (lucide component, optional)
 *  - tone: 'danger' | 'warning' | 'brand' (default 'warning') — controls header color
 *  - input: { label, placeholder, required, maxLength, initial } | undefined
 *      when provided, a textarea is rendered and its value passed to onConfirm
 *  - presets: string[] — quick-pick chips that fill the input
 *  - confirmLabel, confirmVariant ('primary'|'danger'|'secondary'|...)
 *  - cancelLabel (default 'Cancel')
 *  - isSubmitting
 *  - onClose, onConfirm(value | undefined)
 */
export function ConfirmModal({
  open,
  title,
  description,
  icon: Icon = AlertTriangle,
  tone = 'warning',
  input,
  presets,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  onClose,
  onConfirm,
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue(input?.initial || '');
  }, [open, input?.initial]);

  if (!open) return null;

  const toneStyles = {
    danger: 'bg-red-50/60 text-red-700 dark:bg-red-950/30 dark:text-red-200',
    warning: 'bg-amber-50/60 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200',
    brand: 'bg-brand-50/60 text-brand-700 dark:bg-brand-950/30 dark:text-brand-200',
  };
  const iconColor = {
    danger: 'text-red-600 dark:text-red-300',
    warning: 'text-amber-600 dark:text-amber-300',
    brand: 'text-brand-600 dark:text-brand-300',
  };

  const trimmed = value.trim();
  const valid = !input || !input.required || trimmed.length > 0;

  function submit(e) {
    e?.preventDefault?.();
    if (!valid) return;
    onConfirm(input ? trimmed : undefined);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={16} />
        </button>

        <div className={`border-b border-slate-200 px-6 py-5 dark:border-slate-800 ${toneStyles[tone]}`}>
          <div className="flex items-center gap-2">
            <Icon size={18} className={iconColor[tone]} />
            <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
          </div>
          {description && (
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{description}</p>
          )}
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          {input && (
            <div>
              {presets?.length ? (
                <div className="mb-3">
                  <div className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Quick reasons
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setValue(p)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
                      >
                        {p.length > 40 ? p.slice(0, 40) + '…' : p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <label htmlFor="confirm-input" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {input.label}
              </label>
              <textarea
                id="confirm-input"
                rows={3}
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={input.maxLength || 280}
                placeholder={input.placeholder}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{input.required ? 'Required' : 'Optional'}</span>
                <span>
                  {value.length}/{input.maxLength || 280}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant={confirmVariant}
              isLoading={isSubmitting}
              disabled={!valid}
            >
              {confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
