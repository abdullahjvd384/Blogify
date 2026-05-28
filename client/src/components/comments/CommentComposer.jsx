import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateComment } from '@/features/comments/hooks';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/Avatar';
import { readApiError } from '@/lib/apiError';
import { COMMENT_LIMITS } from '@blogplatform/shared';

export function CommentComposer({
  articleId,
  parentId = null,
  onSubmitted,
  placeholder = 'Write a response…',
  autoFocus = false,
}) {
  const user = useAuthStore((s) => s.user);
  const [body, setBody] = useState('');
  const create = useCreateComment(articleId);

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-300">
          Sign in
        </Link>{' '}
        to join the conversation.
      </div>
    );
  }

  function submit(e) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    create.mutate(
      { body: trimmed, parentId },
      {
        onSuccess: () => {
          setBody('');
          onSubmitted?.();
        },
        onError: (err) => toast.error(readApiError(err)),
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-3">
      <Avatar user={user} size="sm" className="mt-1" />
      <div className="flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={parentId ? 2 : 3}
          maxLength={COMMENT_LIMITS.MAX_BODY}
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          {parentId && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onSubmitted?.()}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" isLoading={create.isPending} disabled={!body.trim()}>
            {parentId ? 'Reply' : 'Respond'}
          </Button>
        </div>
      </div>
    </form>
  );
}
