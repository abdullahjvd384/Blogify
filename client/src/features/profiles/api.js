import { api } from '@/lib/api';

export const profilesApi = {
  get: (handle) => api.get(`/profiles/${handle}`).then((r) => r.data.data.profile),
  listArticles: (handle, params = {}) =>
    api.get(`/profiles/${handle}/articles`, { params }).then((r) => r.data),
};
