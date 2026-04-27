import { api } from '@/lib/api';

export const authApi = {
  signup: (input) => api.post('/auth/signup', input).then((r) => r.data.data.user),
  login: (input) => api.post('/auth/login', input).then((r) => r.data.data.user),
  logout: () => api.post('/auth/logout').then(() => null),
  me: () => api.get('/auth/me').then((r) => r.data.data.user),
};
