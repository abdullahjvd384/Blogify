import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMe } from '@/features/auth/hooks';

/**
 * Gates a route on auth (and optionally a role).
 * Waits for the initial /auth/me probe to settle before redirecting,
 * so a hard refresh on a protected page doesn't bounce to /login.
 */
export function ProtectedRoute({ role, children }) {
  const location = useLocation();
  const me = useMe();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (me.isLoading && !isHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role && user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-slate-500">You need {role} permissions.</p>
      </div>
    );
  }

  return children;
}
