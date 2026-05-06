import { api } from '@/lib/api';

export const subscriptionApi = {
  plans: () => api.get('/subscriptions/plans').then((r) => r.data.data.plans),
  me: () => api.get('/subscriptions/me').then((r) => r.data.data),
};
