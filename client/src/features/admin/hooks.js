import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './api';

export function useModerationQueue({ status = 'needs_review', limit = 20 } = {}) {
  return useQuery({
    queryKey: ['admin', 'moderation', { status, limit }],
    queryFn: () => adminApi.moderationQueue({ status, limit }),
    staleTime: 5_000,
  });
}

export function useAdminApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'moderation'] }),
  });
}

export function useAdminReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reasons }) => adminApi.reject(id, reasons),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'moderation'] }),
  });
}

export function useAdminRetry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.retry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'moderation'] }),
  });
}
