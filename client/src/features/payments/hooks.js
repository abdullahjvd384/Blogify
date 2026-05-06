import { useMutation, useQuery } from '@tanstack/react-query';
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
