import { NavLink, Outlet } from 'react-router-dom';
import { FileText, PlusCircle } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '@/lib/cn';

const subItems = [
  { to: '/writer/drafts', label: 'Drafts', icon: FileText },
  { to: '/writer/new', label: 'New article', icon: PlusCircle },
];

const linkClass = ({ isActive }) =>
  cn(
    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 dark:bg-brand-950/60 dark:text-brand-200 dark:ring-brand-800/60'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100',
  );

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Header />
      <div className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <span className="hidden text-xs font-semibold uppercase tracking-wider text-slate-500 sm:inline dark:text-slate-400">
            Writer
          </span>
          <span className="hidden h-4 w-px bg-slate-200 sm:inline-block dark:bg-slate-800" />
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
