import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="relative isolate flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-fade" />
      <p className="font-display text-7xl font-bold tracking-tight">
        <span className="gradient-text">404</span>
      </p>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
        We couldn't find that page
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        The link might be broken, or the page may have been removed. Let's get
        you back on track.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button leftIcon={<ArrowLeft />} variant="secondary">
            Back home
          </Button>
        </Link>
        <Link to="/articles">
          <Button leftIcon={<Compass />}>Browse articles</Button>
        </Link>
      </div>
    </div>
  );
}
