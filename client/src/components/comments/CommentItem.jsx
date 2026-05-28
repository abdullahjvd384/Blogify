import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageCircle, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { useComments, useEditComment, useDeleteComment } from '@/features/comments/hooks';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/Button';
import { CommentComposer } from './CommentComposer';
import { profilePath } from '@/lib/profile';
import { readApiError } from '@/lib/apiError';

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CommentItem({ comment, articleId, currentUser, depth = 0 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body || '');
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const edit = useEditComment(articleId);
  const del = useDeleteComment(articleId);
  const repliesQuery = useComments(articleId, {
    parentId: comment.id,
    enabled: showReplies && depth === 0,
  });
  const replies = useMemo(
    () => (repliesQuery.data?.pages || []).flatMap((p) => p.data || []),
    [repliesQuery.data],
  );

  const isDeleted = comment.status === 'deleted' || comment.body === null;
  const canManage =
    currentUser && (currentUser.id === comment.author?.id || currentUser.role === 'admin');

  function saveEdit() {
    const body = draft.trim();
    if (!body) return;
    edit.mutate(
      { commentId: comment.id, body },
      {
        onSuccess: () => setEditing(false),
        onError: (err) => toast.error(readApiError(err)),
      },
    );
  }

  function remove() {
    if (!window.confirm('Delete this comment?')) return;
    del.mutate(
      { commentId: comment.id },
      { onError: (err) => toast.error(readApiError(err)) },
    );
  }

  return (
    <div className="flex gap-3">
      <Link to={comment.author ? profilePath(comment.author) : '#'}>
        <Avatar user={comment.author} size="sm" className="mt-0.5" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
          {comment.author ? (
            <Link
              to={profilePath(comment.author)}
              className="font-semibold text-slate-900 hover:underline dark:text-slate-100"
            >
              {comment.author.name}
            </Link>
          ) : (
            <span className="font-semibold text-slate-500">Unknown</span>
          )}
          <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
          {comment.editedAt && <span className="text-xs text-slate-400">(edited)</span>}
        </div>

        {editing ? (
          <div className="mt-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} isLoading={edit.isPending}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p
            className={
              isDeleted
                ? 'mt-1 text-sm italic text-slate-400'
                : 'mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300'
            }
          >
            {isDeleted ? 'This comment was deleted.' : comment.body}
          </p>
        )}

        {!editing && (
          <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {depth === 0 && !isDeleted && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                className="inline-flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-300"
              >
                <MessageCircle size={13} /> Reply
              </button>
            )}
            {canManage && !isDeleted && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(comment.body || '');
                    setEditing(true);
                  }}
                  className="inline-flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-300"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  type="button"
                  onClick={remove}
                  className="inline-flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </>
            )}
          </div>
        )}

        {replying && (
          <div className="mt-3">
            <CommentComposer
              articleId={articleId}
              parentId={comment.id}
              autoFocus
              placeholder="Write a reply…"
              onSubmitted={() => {
                setReplying(false);
                setShowReplies(true);
              }}
            />
          </div>
        )}

        {depth === 0 && comment.repliesCount > 0 && (
          <button
            type="button"
            onClick={() => setShowReplies((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
          >
            <ChevronDown
              size={14}
              className={showReplies ? 'rotate-180 transition-transform' : 'transition-transform'}
            />
            {showReplies ? 'Hide' : 'View'} {comment.repliesCount}{' '}
            {comment.repliesCount === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {showReplies && replies.length > 0 && (
          <div className="mt-4 space-y-4 border-l border-slate-200 pl-4 dark:border-slate-800">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                articleId={articleId}
                currentUser={currentUser}
                depth={1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
