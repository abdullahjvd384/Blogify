import { api } from '@/lib/api';

export const articlesApi = {
  list: (params = {}) => api.get('/articles', { params }).then((r) => r.data),
  getBySlug: (slug) => api.get(`/articles/${slug}`).then((r) => r.data.data.article),
  listMine: (params = {}) => api.get('/articles/mine', { params }).then((r) => r.data),
  create: (input) => api.post('/articles', input).then((r) => r.data.data.article),
  update: (id, patch) => api.patch(`/articles/${id}`, patch).then((r) => r.data.data.article),
  remove: (id) => api.delete(`/articles/${id}`).then(() => null),
  submit: (id) => api.post(`/articles/${id}/submit`).then((r) => r.data.data.article),
};
