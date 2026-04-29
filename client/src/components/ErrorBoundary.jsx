import { Component } from 'react';

/**
 * Last-resort UI guard for render-time exceptions. Network/data errors should
 * be surfaced via React Query toasts, not here.
 */
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
        <div className="mx-auto max-w-md py-16 text-center">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-500">{String(this.state.error.message)}</p>
          <button
            onClick={() => location.reload()}
            className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
