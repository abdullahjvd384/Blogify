import { useQuery } from '@tanstack/react-query';
import { articlesApi } from './api';

export function useArticleFeed({ tag, limit = 20 } = {}) {
  return useQuery({
    queryKey: ['articles', { tag, limit }],
    queryFn: () => articlesApi.list({ tag, limit }),
    staleTime: 30_000,
  });
}

export function useArticle(slug) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.getBySlug(slug),
    enabled: Boolean(slug),
  });
}
