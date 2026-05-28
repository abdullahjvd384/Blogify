import { api } from '@/lib/api';

export const followsApi = {
  follow: (userId) => api.post(`/users/${userId}/follow`).then((r) => r.data.data),
  unfollow: (userId) => api.delete(`/users/${userId}/follow`).then((r) => r.data.data),
  followers: (userId, params = {}) =>
    api.get(`/users/${userId}/followers`, { params }).then((r) => r.data),
  following: (userId, params = {}) =>
    api.get(`/users/${userId}/following`, { params }).then((r) => r.data),
};
