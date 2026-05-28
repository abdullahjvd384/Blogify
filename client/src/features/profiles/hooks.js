import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { profilesApi } from './api';

export function useProfile(handle) {
  return useQuery({
    queryKey: ['profile', handle],
    queryFn: () => profilesApi.get(handle),
    enabled: Boolean(handle),
  });
}

export function useProfileArticles(handle, { limit = 12 } = {}) {
  return useInfiniteQuery({
    queryKey: ['profile-articles', handle, { limit }],
    queryFn: ({ pageParam }) =>
      profilesApi.listArticles(handle, { limit, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: null,
    getNextPageParam: (last) => (last?.page?.hasMore ? last.page.cursor : undefined),
    enabled: Boolean(handle),
    staleTime: 30_000,
  });
}
