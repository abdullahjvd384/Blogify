import { api } from '@/lib/api';

export const tagsApi = {
  get: (tag) => api.get(`/tags/${encodeURIComponent(tag)}`).then((r) => r.data.data.tag),
  follow: (tag) => api.post(`/tags/${encodeURIComponent(tag)}/follow`).then((r) => r.data.data),
  unfollow: (tag) => api.delete(`/tags/${encodeURIComponent(tag)}/follow`).then((r) => r.data.data),
  followed: () => api.get('/tags/me/following').then((r) => r.data.data.tags),
};
