import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { commentsApi } from './api';

export function useComments(articleId, { parentId = null, limit = 20, enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: ['comments', articleId, { parentId }],
    queryFn: ({ pageParam }) =>
      commentsApi.list(articleId, {
        limit,
        ...(parentId ? { parentId } : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: null,
    getNextPageParam: (last) => (last?.page?.hasMore ? last.page.cursor : undefined),
    enabled: Boolean(articleId) && enabled,
  });
}

export function useCreateComment(articleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, parentId = null }) => commentsApi.create(articleId, { body, parentId }),
    onSuccess: (_comment, { parentId }) => {
      qc.invalidateQueries({ queryKey: ['comments', articleId, { parentId: parentId || null }] });
      // Bump the article's comment count in cache if present.
      qc.setQueriesData({ queryKey: ['article'] }, (prev) => {
        if (!prev || prev.id !== articleId) return prev;
        const stats = prev.statsSnapshot || {};
        return { ...prev, statsSnapshot: { ...stats, commentsCount: (stats.commentsCount || 0) + 1 } };
      });
    },
  });
}

export function useEditComment(articleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }) => commentsApi.edit(articleId, commentId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', articleId] }),
  });
}

export function useDeleteComment(articleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId }) => commentsApi.remove(articleId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', articleId] }),
  });
}
