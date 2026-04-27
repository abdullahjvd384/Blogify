import { create } from 'zustand';

/**
 * Holds the current authenticated user. Hydrated by `useMe()` on app boot;
 * cleared on logout / 401-refresh-fail.
 *
 * Keep this store narrow — server data lives in TanStack Query.
 */
export const useAuthStore = create((set) => ({
  user: null,
  isHydrated: false,
  setUser: (user) => set({ user, isHydrated: true }),
  clear: () => set({ user: null, isHydrated: true }),
}));
