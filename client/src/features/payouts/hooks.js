import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutsApi } from './api';

export function useMyEarnings() {
  return useQuery({
    queryKey: ['payouts', 'me', 'earnings'],
    queryFn: payoutsApi.myEarnings,
    staleTime: 30_000,
  });
}

export function useMyWithdrawals() {
  return useQuery({
    queryKey: ['payouts', 'me', 'withdrawals'],
    queryFn: payoutsApi.myWithdrawals,
    staleTime: 15_000,
  });
}

export function useRequestWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payoutsApi.requestWithdrawal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payouts', 'me'] });
    },
  });
}

// ---- Admin ----

export function usePayoutPeriods() {
  return useQuery({ queryKey: ['admin', 'payouts', 'periods'], queryFn: payoutsApi.periods });
}

export function usePayoutPreview(periodKey, enabled) {
  return useQuery({
    queryKey: ['admin', 'payouts', 'preview', periodKey],
    queryFn: () => payoutsApi.preview(periodKey),
    enabled: Boolean(periodKey) && enabled,
  });
}

export function useClosePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodKey) => payoutsApi.close(periodKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'payouts'] }),
  });
}

export function useAdminWithdrawals(status) {
  return useQuery({
    queryKey: ['admin', 'withdrawals', status || 'all'],
    queryFn: () => payoutsApi.adminWithdrawals(status ? { status } : {}),
  });
}

export function useMarkWithdrawalPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => payoutsApi.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] }),
  });
}

export function useRejectWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => payoutsApi.rejectWithdrawal(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] }),
  });
}
