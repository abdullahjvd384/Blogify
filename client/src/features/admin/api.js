import { api } from '@/lib/api';

export const adminApi = {
  moderationQueue: (params = {}) =>
    api.get('/admin/moderation', { params }).then((r) => r.data),
  approve: (id, body = {}) =>
    api.post(`/admin/moderation/${id}/approve`, body).then((r) => r.data.data.article),
  reject: (id, reasons) =>
    api.post(`/admin/moderation/${id}/reject`, { reasons }).then((r) => r.data.data.article),
  retry: (id) =>
    api.post(`/admin/moderation/${id}/retry`).then((r) => r.data.data.article),
  listUsers: (params = {}) =>
    api.get('/admin/users', { params }).then((r) => r.data),
  userStats: () =>
    api.get('/admin/users/stats').then((r) => r.data.data),
  updateUser: (id, patch) =>
    api.patch(`/admin/users/${id}`, patch).then((r) => r.data.data.user),
};
