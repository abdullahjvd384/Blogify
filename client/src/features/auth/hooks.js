import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from './api';
import { useAuthStore } from '@/stores/authStore';

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const query = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.isSuccess) setUser(query.data);
    if (query.isError) clear();
  }, [query.isSuccess, query.isError, query.data, setUser, clear]);

  return query;
}

export function useLogin() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(['me'], user);
    },
  });
}

export function useSignup() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(['me'], user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clear();
      qc.removeQueries({ queryKey: ['me'] });
    },
  });
}
