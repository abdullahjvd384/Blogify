import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { followsApi } from './api';

/**
 * Follow/unfollow with optimistic update on the cached profile (['profile', handle]).
 * The mutation input is { userId, isFollowing } — isFollowing is the CURRENT state,
 * so we flip it.
 */
export function useToggleFollow(handle) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isFollowing }) =>
      isFollowing ? followsApi.unfollow(userId) : followsApi.follow(userId),
    onMutate: async ({ isFollowing }) => {
      await qc.cancelQueries({ queryKey: ['profile', handle] });
      const prev = qc.getQueryData(['profile', handle]);
      if (prev) {
        qc.setQueryData(['profile', handle], {
          ...prev,
          isFollowing: !isFollowing,
          followersCount: Math.max(0, (prev.followersCount || 0) + (isFollowing ? -1 : 1)),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['profile', handle], ctx.prev);
    },
    onSuccess: (result) => {
      qc.setQueryData(['profile', handle], (prev) =>
        prev
          ? { ...prev, isFollowing: result.following, followersCount: result.followersCount }
          : prev,
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['articles', 'following'] });
    },
  });
}

export function useFollowList(userId, type = 'followers', { limit = 20 } = {}) {
  return useInfiniteQuery({
    queryKey: ['follow-list', type, userId, { limit }],
    queryFn: ({ pageParam }) =>
      followsApi[type](userId, { limit, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: null,
    getNextPageParam: (last) => (last?.page?.hasMore ? last.page.cursor : undefined),
    enabled: Boolean(userId),
  });
}
