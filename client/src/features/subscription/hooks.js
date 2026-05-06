import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from './api';
import { useAuthStore } from '@/stores/authStore';

export function usePlans() {
  return useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: subscriptionApi.plans,
    staleTime: 60 * 60_000,
  });
}

export function useMySubscription() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['subscription', 'me'],
    queryFn: subscriptionApi.me,
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
