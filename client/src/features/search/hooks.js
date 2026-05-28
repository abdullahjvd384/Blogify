import { useQuery } from '@tanstack/react-query';
import { searchApi } from './api';

export function useSearch(q, { limit = 8, enabled = true } = {}) {
  const term = (q || '').trim();
  return useQuery({
    queryKey: ['search', term, limit],
    queryFn: () => searchApi.search(term, limit),
    enabled: enabled && term.length > 0,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}
