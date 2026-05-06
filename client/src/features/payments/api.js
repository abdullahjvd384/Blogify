import { api } from '@/lib/api';

export const paymentsApi = {
  checkout: (planKey) =>
    api.post('/payments/checkout', { planKey }).then((r) => r.data.data),
  status: (txnRefNo) =>
    api.get(`/payments/${encodeURIComponent(txnRefNo)}`).then((r) => r.data.data),
};
