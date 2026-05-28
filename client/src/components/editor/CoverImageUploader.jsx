import { useRef } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadImage } from '@/features/uploads/hooks';
import { Button } from '@/components/ui/Button';

/** Cover image upload (Cloudinary) with preview + remove. `kind` defaults to 'cover'. */
export function CoverImageUploader({ value, onChange, disabled = false, kind = 'cover' }) {
  const fileRef = useRef(null);
  const upload = useUploadImage();

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await upload.mutateAsync({ file, kind });
      onChange(url);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <img src={value} alt="Cover" className="block max-h-56 w-full object-cover" />
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            aria-label="Remove cover image"
          >
            <X size={15} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || upload.isPending}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-8 text-sm text-slate-500 transition hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:border-brand-700"
      >
        {upload.isPending ? (
          <Loader2 size={22} className="animate-spin" />
        ) : (
          <ImagePlus size={22} />
        )}
        <span>{upload.isPending ? 'Uploading…' : 'Upload a cover image'}</span>
        <span className="text-xs text-slate-400">JPG, PNG, WEBP or GIF · up to 5MB</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      <p className="mt-2 text-xs text-slate-400">
        Tip: a strong cover image makes your story stand out in the feed.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="mt-1"
        disabled={disabled}
        onClick={() => {
          const url = window.prompt('Paste an image URL');
          if (url) onChange(url);
        }}
      >
        or paste a URL
      </Button>
    </div>
  );
}
