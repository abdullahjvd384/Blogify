import { api } from '@/lib/api';

export const searchApi = {
  search: (q, limit = 8) => api.get('/search', { params: { q, limit } }).then((r) => r.data.data),
};
