import { NavLink, Outlet } from 'react-router-dom';
import { Header } from './Header';
import { cn } from '@/lib/cn';

const subNavLink = ({ isActive }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-amber-100 text-amber-900 dark:bg-amber-600/30 dark:text-amber-100'
      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
  );

export function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="border-b border-amber-300/60 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2">
          <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-700 dark:text-amber-100">
            Admin
          </span>
          <NavLink to="/admin/moderation" className={subNavLink}>
            Moderation
          </NavLink>
        </div>
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
