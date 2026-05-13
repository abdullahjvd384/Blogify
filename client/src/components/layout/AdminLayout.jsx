import { NavLink, Outlet } from 'react-router-dom';
import { Shield, Gavel, Users, Wallet } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '@/lib/cn';

const subItems = [
  { to: '/admin/moderation', label: 'Moderation', icon: Gavel },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: Wallet },
];

const linkClass = ({ isActive }) =>
  cn(
    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800/60'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100',
  );

export function AdminLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Header />
      <div className="border-b border-amber-200/70 bg-gradient-to-r from-amber-50 via-amber-50/60 to-transparent dark:border-amber-900/40 dark:from-amber-950/30 dark:via-amber-950/10">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-900 ring-1 ring-inset ring-amber-300 dark:bg-amber-900/60 dark:text-amber-100 dark:ring-amber-800">
            <Shield size={11} />
            Admin
          </span>
          <span className="hidden h-4 w-px bg-amber-300/60 sm:inline-block dark:bg-amber-800" />
          <nav className="flex flex-wrap items-center gap-1">
            {subItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <item.icon size={14} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
