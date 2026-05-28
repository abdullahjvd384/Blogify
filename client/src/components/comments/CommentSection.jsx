import { useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { useComments } from '@/features/comments/hooks';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { CommentComposer } from './CommentComposer';
import { CommentItem } from './CommentItem';

export function CommentSection({ articleId, count = 0 }) {
  const user = useAuthStore((s) => s.user);
  const query = useComments(articleId, { limit: 20 });
  const comments = useMemo(
    () => (query.data?.pages || []).flatMap((p) => p.data || []),
    [query.data],
  );

  return (
    <section className="mt-14">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
        <MessageSquare size={18} className="text-brand-500" />
        Responses
        {count > 0 && (
          <span className="text-sm font-normal text-slate-400">({count})</span>
        )}
      </h2>

      <div className="mt-5">
        <CommentComposer articleId={articleId} />
      </div>

      <div className="mt-8 space-y-6">
        {query.isLoading && (
          <p className="text-sm text-slate-400">Loading responses…</p>
        )}

        {!query.isLoading && comments.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No responses yet. {user ? 'Be the first to respond.' : 'Sign in to be the first to respond.'}
          </p>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            articleId={articleId}
            currentUser={user}
          />
        ))}

        {query.hasNextPage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => query.fetchNextPage()}
            isLoading={query.isFetchingNextPage}
          >
            Load more responses
          </Button>
        )}
      </div>
    </section>
  );
}
