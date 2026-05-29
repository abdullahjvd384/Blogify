import { api } from '@/lib/api';

export const payoutsApi = {
  // Writer
  myEarnings: () => api.get('/payouts/me/earnings').then((r) => r.data.data.earnings),
  myWithdrawals: () => api.get('/payouts/me/withdrawals').then((r) => r.data.data.withdrawals),
  requestWithdrawal: (body) =>
    api.post('/payouts/me/withdrawals', body).then((r) => r.data.data.withdrawal),

  // Admin: payouts
  periods: () => api.get('/admin/payouts/periods').then((r) => r.data.data.periods),
  preview: (periodKey) =>
    api.get('/admin/payouts/preview', { params: { periodKey } }).then((r) => r.data.data.preview),
  close: (periodKey) =>
    api.post('/admin/payouts/close', { periodKey }).then((r) => r.data.data.period),

  // Admin: withdrawals
  adminWithdrawals: (params = {}) =>
    api.get('/admin/withdrawals', { params }).then((r) => r.data.data.withdrawals),
  markPaid: (id) => api.post(`/admin/withdrawals/${id}/mark-paid`).then((r) => r.data.data.withdrawal),
  rejectWithdrawal: (id, note) =>
    api.post(`/admin/withdrawals/${id}/reject`, { note }).then((r) => r.data.data.withdrawal),
};
