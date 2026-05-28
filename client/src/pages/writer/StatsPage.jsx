import { Link } from 'react-router-dom';
import { BarChart3, Eye, ArrowBigUp, MessageSquare, Users, FileText, Clock } from 'lucide-react';
import { useWriterStats } from '@/features/articles/hooks';
import { Badge } from '@/components/ui/Badge';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}

export default function StatsPage() {
  const { data, isLoading } = useWriterStats();
  const totals = data?.totals;
  const articles = data?.articles || [];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <Badge variant="brand" leftIcon={<BarChart3 />}>Analytics</Badge>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
        Your stats
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        How your published stories are performing.
      </p>

      {isLoading ? (
        <div className="mt-8 h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard icon={Eye} label="Total reads" value={totals?.reads ?? 0} accent="bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300" />
            <StatCard icon={ArrowBigUp} label="Upvotes" value={totals?.upvotes ?? 0} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300" />
            <StatCard icon={MessageSquare} label="Responses" value={totals?.comments ?? 0} accent="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300" />
            <StatCard icon={Users} label="Followers" value={totals?.followers ?? 0} accent="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300" />
            <StatCard icon={FileText} label="Published" value={totals?.articles ?? 0} accent="bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300" />
          </div>

          <h2 className="mt-12 mb-4 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
            Per-article breakdown
          </h2>

          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/40 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No published stories yet. Once you publish, performance shows up here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Story</th>
                    <th className="px-3 py-3 text-right font-medium"><Eye size={13} className="inline" /></th>
                    <th className="px-3 py-3 text-right font-medium"><ArrowBigUp size={13} className="inline" /></th>
                    <th className="px-3 py-3 text-right font-medium"><MessageSquare size={13} className="inline" /></th>
                    <th className="hidden px-3 py-3 text-right font-medium sm:table-cell"><Clock size={13} className="inline" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900/40">
                  {articles.map((a) => (
                    <tr key={a.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="max-w-0 px-4 py-3">
                        <Link to={`/articles/${a.slug}`} className="block truncate font-medium text-slate-900 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-300">
                          {a.title}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{a.reads}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{a.upvotes}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{a.comments}</td>
                      <td className="hidden px-3 py-3 text-right tabular-nums text-slate-500 sm:table-cell">{a.readMinutes}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
