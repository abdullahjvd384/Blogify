import { NavLink, Outlet } from 'react-router-dom';
import { Header } from './Header';
import { cn } from '@/lib/cn';

const subNavLink = ({ isActive }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100'
      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
  );

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-5xl gap-1 px-6 py-2">
          <NavLink to="/writer/drafts" className={subNavLink}>
            Drafts
          </NavLink>
          <NavLink to="/writer/new" className={subNavLink}>
            New article
          </NavLink>
        </div>
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
