import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { notificationsApi } from './api';

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    enabled,
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
    staleTime: 20_000,
  });
}

export function useNotifications({ limit = 20, enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam }) =>
      notificationsApi.list({ limit, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: null,
    getNextPageParam: (last) => (last?.page?.hasMore ? last.page.cursor : undefined),
    enabled,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.setQueryData(['notifications', 'unread-count'], 0);
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}
