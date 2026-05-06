import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { articlesApi } from './api';

export function useArticleFeed({ tag, limit = 20 } = {}) {
  return useInfiniteQuery({
    queryKey: ['articles', 'feed', { tag, limit }],
    queryFn: ({ pageParam }) =>
      articlesApi.list({ tag, limit, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: null,
    getNextPageParam: (last) => (last?.page?.hasMore ? last.page.cursor : undefined),
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

export function useMyArticles({ status } = {}) {
  return useQuery({
    queryKey: ['articles', 'mine', { status }],
    queryFn: () => articlesApi.listMine({ ...(status ? { status } : {}) }),
    staleTime: 10_000,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: articlesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles', 'mine'] }),
  });
}

export function useUpdateArticle(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) => articlesApi.update(id, patch),
    onSuccess: (article) => {
      qc.setQueryData(['article-draft', article.id], article);
      qc.invalidateQueries({ queryKey: ['articles', 'mine'] });
    },
  });
}

export function useSubmitArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => articlesApi.submit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles', 'mine'] }),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => articlesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles', 'mine'] }),
  });
}

export function useVote(slug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }) =>
      value === 0 ? articlesApi.unvote(id) : articlesApi.vote(id, value),
    onSuccess: ({ totals, myVote }) => {
      qc.setQueryData(['article', slug], (prev) =>
        prev
          ? {
              ...prev,
              myVote,
              statsSnapshot: { ...(prev.statsSnapshot || {}), ...totals },
            }
          : prev,
      );
    },
  });
}
