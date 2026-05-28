import { api } from '@/lib/api';

export const articlesApi = {
  list: (params = {}) => api.get('/articles', { params }).then((r) => r.data),
  listFollowing: (params = {}) => api.get('/articles/following', { params }).then((r) => r.data),
  listForYou: (params = {}) => api.get('/articles/for-you', { params }).then((r) => r.data),
  myStats: () => api.get('/articles/mine/stats').then((r) => r.data.data.stats),
  getBySlug: (slug) => api.get(`/articles/${slug}`).then((r) => r.data.data.article),
  listMine: (params = {}) => api.get('/articles/mine', { params }).then((r) => r.data),
  getMineById: (id) => api.get(`/articles/mine/${id}`).then((r) => r.data.data.article),
  create: (input) => api.post('/articles', input).then((r) => r.data.data.article),
  update: (id, patch) => api.patch(`/articles/${id}`, patch).then((r) => r.data.data.article),
  remove: (id) => api.delete(`/articles/${id}`).then(() => null),
  submit: (id) => api.post(`/articles/${id}/submit`).then((r) => r.data.data.article),
  vote: (id, value) => api.post(`/articles/${id}/vote`, { value }).then((r) => r.data.data),
  unvote: (id) => api.delete(`/articles/${id}/vote`).then((r) => r.data.data),
};
