import { api } from '@/lib/api';

export const paymentsApi = {
  // Legacy automated flow (kept for completeness, not used in UI).
  checkout: (planKey) =>
    api.post('/payments/checkout', { planKey }).then((r) => r.data.data),
  status: (txnRefNo) =>
    api.get(`/payments/${encodeURIComponent(txnRefNo)}`).then((r) => r.data.data),

  // Manual JazzCash flow (primary).
  info: () => api.get('/payments/info').then((r) => r.data.data),
  submitManual: (body) =>
    api.post('/payments/manual-submit', body).then((r) => r.data.data.payment),
  mine: (params = {}) =>
    api.get('/payments/mine', { params }).then((r) => r.data.data.payments),

  // Admin.
  adminList: (params = {}) =>
    api.get('/admin/payments', { params }).then((r) => r.data.data.payments),
  adminApprove: (id) =>
    api.post(`/admin/payments/${id}/approve`).then((r) => r.data.data.payment),
  adminReject: (id, reason) =>
    api.post(`/admin/payments/${id}/reject`, { reason }).then((r) => r.data.data.payment),
};
