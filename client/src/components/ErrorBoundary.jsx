import { Component } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI crash:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4 py-16 dark:bg-slate-950">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300">
              <AlertTriangle size={22} />
            </span>
            <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Something went wrong
            </h2>
            <p className="mt-2 break-words text-sm text-slate-500 dark:text-slate-400">
              {String(this.state.error.message || 'Unexpected error')}
            </p>
            <button
              type="button"
              onClick={() => location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white shadow-lift transition hover:from-brand-500 hover:to-brand-700"
            >
              <RefreshCcw size={14} />
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
