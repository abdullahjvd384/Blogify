import { useMe } from '@/features/auth/hooks';

/**
 * Mounts at the root so `useMe()` runs once on app boot and hydrates
 * the auth store before any route renders. Renders children unconditionally —
 * route-level gating is handled by `ProtectedRoute`.
 */
export function AuthGate({ children }) {
  useMe();
  return children;
}
