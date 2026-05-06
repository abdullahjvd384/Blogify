import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/features/auth/hooks';
import { useMySubscription } from '@/features/subscription/hooks';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const linkClass = ({ isActive }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
  );

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: sub } = useMySubscription();

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      toast.success('Logged out');
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link to="/" className="text-base font-semibold tracking-tight">
          Blog Platform
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/articles" className={linkClass}>
            Read
          </NavLink>
          <NavLink to="/pricing" className={linkClass}>
            Pricing
          </NavLink>
          {user && (
            <NavLink to="/writer" className={linkClass}>
              Write
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {sub?.usage && (
                <Link
                  to="/pricing"
                  title={`Daily reads on ${sub.plan?.label || sub.usage.plan}`}
                  className="hidden rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600 hover:border-brand-500 hover:text-brand-700 sm:inline-block dark:border-slate-700 dark:text-slate-300"
                >
                  {sub.usage.limit === null
                    ? `${sub.plan?.label || 'Unlimited'} · ∞`
                    : `${sub.usage.used}/${sub.usage.limit} today`}
                </Link>
              )}
              <span className="hidden text-xs text-slate-500 sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} isLoading={logout.isPending}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
