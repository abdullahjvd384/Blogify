import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { bookmarksApi } from './api';

export function useIsBookmarked(articleId, enabled = true) {
  return useQuery({
    queryKey: ['bookmark', articleId],
    queryFn: () => bookmarksApi.isSaved(articleId),
    enabled: Boolean(articleId) && enabled,
    staleTime: 60_000,
  });
}

export function useToggleBookmark(articleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currentlySaved) =>
      currentlySaved ? bookmarksApi.remove(articleId) : bookmarksApi.save(articleId),
    onMutate: async (currentlySaved) => {
      await qc.cancelQueries({ queryKey: ['bookmark', articleId] });
      const prev = qc.getQueryData(['bookmark', articleId]);
      qc.setQueryData(['bookmark', articleId], !currentlySaved);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(['bookmark', articleId], ctx.prev);
    },
    onSuccess: (result) => {
      qc.setQueryData(['bookmark', articleId], result.bookmarked);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks', 'saved'] });
    },
  });
}

export function useSavedArticles({ limit = 12 } = {}) {
  return useInfiniteQuery({
    queryKey: ['bookmarks', 'saved', { limit }],
    queryFn: ({ pageParam }) =>
      bookmarksApi.list({ limit, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: null,
    getNextPageParam: (last) => (last?.page?.hasMore ? last.page.cursor : undefined),
    staleTime: 15_000,
  });
}
