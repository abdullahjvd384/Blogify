import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Shield,
  Users as UsersIcon,
  Ban,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  RefreshCcw,
  AlertCircle,
} from 'lucide-react';
import {
  useAdminUsers,
  useAdminUserStats,
  useAdminUpdateUser,
} from '@/features/admin/hooks';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { readApiError } from '@/lib/apiError';
import { cn } from '@/lib/cn';

const ROLE_FILTERS = [
  { value: '', label: 'All roles' },
  { value: 'reader', label: 'Readers' },
  { value: 'writer', label: 'Writers' },
  { value: 'admin', label: 'Admins' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
  { value: 'deleted', label: 'Deleted' },
];

function roleBadge(role) {
  if (role === 'admin') return <Badge variant="warning">{role}</Badge>;
  if (role === 'writer') return <Badge variant="brand">{role}</Badge>;
  return <Badge variant="default">{role}</Badge>;
}

function statusBadge(status) {
  if (status === 'banned') return <Badge variant="danger">banned</Badge>;
  if (status === 'deleted') return <Badge variant="default">deleted</Badge>;
  return <Badge variant="success">active</Badge>;
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
      <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className={cn('mt-1 font-display text-2xl font-bold', accent || 'text-slate-900 dark:text-slate-50')}>
        {value ?? '—'}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const me = useAuthStore((s) => s.user);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const users = useAdminUsers({ q: q || undefined, role: role || undefined, status: status || undefined, limit: 30 });
  const stats = useAdminUserStats();
  const updateMut = useAdminUpdateUser();

  const items = users.data?.data || [];

  function applySearch(e) {
    e.preventDefault();
    setQ(qDraft.trim());
  }

  async function patch(id, body, successMsg) {
    try {
      await updateMut.mutateAsync({ id, patch: body });
      toast.success(successMsg);
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  const statCards = useMemo(() => {
    const s = stats.data || {};
    return [
      { label: 'Total users', value: s.total },
      { label: 'Admins', value: s.byRole?.admin ?? 0, accent: 'text-amber-600 dark:text-amber-400' },
      { label: 'Writers', value: s.byRole?.writer ?? 0, accent: 'text-sky-600 dark:text-sky-400' },
      { label: 'Readers', value: s.byRole?.reader ?? 0 },
      { label: 'Banned', value: s.byStatus?.banned ?? 0, accent: 'text-red-600 dark:text-red-400' },
    ];
  }, [stats.data]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="warning" leftIcon={<Shield />}>Admin · Users</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            User management
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Promote writers, ban abusers, or reactivate accounts. Self-actions are blocked.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCcw />}
          onClick={() => { users.refetch(); stats.refetch(); }}
          isLoading={users.isFetching || stats.isFetching}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <form onSubmit={applySearch} className="relative flex-1 min-w-[220px] max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="Search name or email"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
          />
        </form>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          {ROLE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
        {users.isLoading && (
          <div className="space-y-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {users.isError && (
          <div className="flex items-start gap-3 p-5 text-sm text-red-700 dark:text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            Failed to load users.
          </div>
        )}

        {!users.isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <UsersIcon size={28} className="text-slate-400" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No users match the filters.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50/60 text-left text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((u) => {
                  const isSelf = me?.id === u.id;
                  const isBanned = u.status === 'banned';
                  const isDeleted = u.status === 'deleted';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{u.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">{roleBadge(u.role)}</td>
                      <td className="px-4 py-3">
                        {statusBadge(u.status)}
                        {isBanned && u.bannedReason && (
                          <div className="mt-1 text-xs text-red-600 dark:text-red-400">{u.bannedReason}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-500 dark:text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {isSelf ? (
                            <span className="text-xs italic text-slate-400">(you)</span>
                          ) : (
                            <>
                              {u.role === 'reader' && (
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  leftIcon={<ArrowUpCircle />}
                                  onClick={() => patch(u.id, { role: 'writer' }, 'Promoted to writer')}
                                >
                                  → writer
                                </Button>
                              )}
                              {u.role === 'writer' && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  leftIcon={<ArrowDownCircle />}
                                  onClick={() => patch(u.id, { role: 'reader' }, 'Demoted to reader')}
                                >
                                  → reader
                                </Button>
                              )}
                              {u.role === 'admin' && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  leftIcon={<ArrowDownCircle />}
                                  onClick={() => patch(u.id, { role: 'writer' }, 'Demoted to writer')}
                                >
                                  → writer
                                </Button>
                              )}
                              {/* Promotion *to* admin is intentionally not available — set via seed/DB. */}

                              {!isBanned && !isDeleted && (
                                <Button
                                  size="xs"
                                  variant="danger"
                                  leftIcon={<Ban />}
                                  onClick={() => {
                                    const reason = window.prompt('Reason for ban (optional):') || '';
                                    patch(u.id, { status: 'banned', bannedReason: reason }, 'User banned');
                                  }}
                                >
                                  Ban
                                </Button>
                              )}
                              {(isBanned || isDeleted) && (
                                <Button
                                  size="xs"
                                  variant="primary"
                                  leftIcon={<CheckCircle2 />}
                                  onClick={() => patch(u.id, { status: 'active' }, 'User reactivated')}
                                >
                                  Reactivate
                                </Button>
                              )}
                              {!isDeleted && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  leftIcon={<Trash2 />}
                                  onClick={() => {
                                    if (window.confirm('Soft-delete this user? They will be marked deleted but the row stays.')) {
                                      patch(u.id, { status: 'deleted' }, 'User deleted');
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
