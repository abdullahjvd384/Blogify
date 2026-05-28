import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from './api';

export function useTag(tag) {
  return useQuery({
    queryKey: ['tag', tag],
    queryFn: () => tagsApi.get(tag),
    enabled: Boolean(tag),
  });
}

export function useToggleTagFollow(tag) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isFollowing) => (isFollowing ? tagsApi.unfollow(tag) : tagsApi.follow(tag)),
    onMutate: async (isFollowing) => {
      await qc.cancelQueries({ queryKey: ['tag', tag] });
      const prev = qc.getQueryData(['tag', tag]);
      if (prev) {
        qc.setQueryData(['tag', tag], {
          ...prev,
          isFollowing: !isFollowing,
          followerCount: Math.max(0, (prev.followerCount || 0) + (isFollowing ? -1 : 1)),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['tag', tag], ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tag', tag] });
      qc.invalidateQueries({ queryKey: ['articles', 'for-you'] });
    },
  });
}
