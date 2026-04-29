import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
        Built for the WebProg project
      </footer>
    </div>
  );
}
