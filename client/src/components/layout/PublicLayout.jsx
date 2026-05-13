import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function PublicLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
