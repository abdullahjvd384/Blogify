import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useMe } from '@/features/auth/hooks';

export default function HomePage() {
  const me = useMe();
  const [health, setHealth] = useState({ state: 'loading' });

  useEffect(() => {
    api
      .get('/healthz')
      .then((r) => setHealth({ state: 'ok', data: r.data.data }))
      .catch((err) => setHealth({ state: 'error', message: err.message }));
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Blog Platform</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Day 1 skeleton — auth + healthcheck wired end-to-end.
      </p>

      <section className="mt-8 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">API Health</h2>
        <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(health, null, 2)}</pre>
      </section>

      <section className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Session</h2>
        <pre className="mt-2 overflow-auto text-xs">
          {me.isLoading
            ? 'loading…'
            : me.isError
              ? 'not signed in'
              : JSON.stringify(me.data, null, 2)}
        </pre>
      </section>
    </main>
  );
}
