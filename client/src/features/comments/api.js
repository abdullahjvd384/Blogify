import { api } from '@/lib/api';

export const commentsApi = {
  list: (articleId, params = {}) =>
    api.get(`/articles/${articleId}/comments`, { params }).then((r) => r.data),
  create: (articleId, payload) =>
    api.post(`/articles/${articleId}/comments`, payload).then((r) => r.data.data.comment),
  edit: (articleId, commentId, body) =>
    api.patch(`/articles/${articleId}/comments/${commentId}`, { body }).then((r) => r.data.data.comment),
  remove: (articleId, commentId) =>
    api.delete(`/articles/${articleId}/comments/${commentId}`).then((r) => r.data.data),
};
