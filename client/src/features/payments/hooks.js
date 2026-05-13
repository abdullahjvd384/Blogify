import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from './api';

export function useCheckout() {
  return useMutation({
    mutationFn: (planKey) => paymentsApi.checkout(planKey),
  });
}

export function usePaymentStatus(txnRefNo, opts = {}) {
  return useQuery({
    queryKey: ['payment', 'status', txnRefNo],
    queryFn: () => paymentsApi.status(txnRefNo),
    enabled: Boolean(txnRefNo),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && status !== 'pending' ? false : 2000;
    },
    ...opts,
  });
}

export function usePaymentInfo() {
  return useQuery({
    queryKey: ['payment', 'info'],
    queryFn: paymentsApi.info,
    staleTime: 60_000,
  });
}

export function useMyPayments() {
  return useQuery({
    queryKey: ['payment', 'mine'],
    queryFn: () => paymentsApi.mine(),
    staleTime: 5_000,
  });
}

export function useSubmitManualPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.submitManual,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment', 'mine'] });
    },
  });
}

export function useAdminPayments({ status } = {}) {
  return useQuery({
    queryKey: ['admin', 'payments', { status }],
    queryFn: () => paymentsApi.adminList({ status }),
    staleTime: 5_000,
  });
}

export function useAdminApprovePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.adminApprove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'payments'] }),
  });
}

export function useAdminRejectPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => paymentsApi.adminReject(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'payments'] }),
  });
}
