import { api } from '@/lib/api';

export const bookmarksApi = {
  isSaved: (articleId) =>
    api.get(`/me/bookmarks/${articleId}`).then((r) => r.data.data.bookmarked),
  save: (articleId) => api.put(`/me/bookmarks/${articleId}`).then((r) => r.data.data),
  remove: (articleId) => api.delete(`/me/bookmarks/${articleId}`).then((r) => r.data.data),
  list: (params = {}) => api.get('/me/bookmarks', { params }).then((r) => r.data),
};
