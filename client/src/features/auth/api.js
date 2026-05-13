import { api } from '@/lib/api';

export const authApi = {
  signup: (input) => api.post('/auth/signup', input).then((r) => r.data.data.user),
  login: (input) => api.post('/auth/login', input).then((r) => r.data.data.user),
  logout: () => api.post('/auth/logout').then(() => null),
  me: () => api.get('/auth/me').then((r) => r.data.data.user),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(() => null),
  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }).then(() => null),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }).then((r) => r.data.data.user),
  resendVerification: () =>
    api.post('/auth/resend-verification').then((r) => r.data.data),
};
