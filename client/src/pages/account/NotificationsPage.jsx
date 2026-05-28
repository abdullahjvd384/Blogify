import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ArrowDown } from 'lucide-react';
import { useNotifications, useMarkAllRead, useMarkRead, useUnreadCount } from '@/features/notifications/hooks';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { notificationMeta, timeAgo } from '@/features/notifications/meta';
import { cn } from '@/lib/cn';

export default function NotificationsPage() {
  const notifs = useNotifications({ limit: 30, enabled: true });
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  const { data: unread = 0 } = useUnreadCount(true);

  const items = useMemo(
    () => (notifs.data?.pages || []).flatMap((p) => p.data || []),
    [notifs.data],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="brand" leftIcon={<Bell />}>Activity</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Notifications
          </h1>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" leftIcon={<CheckCheck />} onClick={() => markAll.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        {notifs.isLoading && <p className="px-5 py-8 text-center text-sm text-slate-400">Loading…</p>}
        {!notifs.isLoading && items.length === 0 && (
          <div className="px-5 py-16 text-center">
            <Bell size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Nothing here yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Follows, responses, and upvotes on your work will show up here.
            </p>
          </div>
        )}
        {items.map((n) => {
          const { text, to } = notificationMeta(n);
          return (
            <Link
              key={n.id}
              to={to}
              onClick={() => !n.readAt && markOne.mutate(n.id)}
              className={cn(
                'flex items-start gap-3 border-b border-slate-100 px-5 py-4 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/50',
                !n.readAt && 'bg-brand-50/40 dark:bg-brand-950/20',
              )}
            >
              <Avatar user={n.actor} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-200">{text}</p>
                <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)} ago</p>
              </div>
              {!n.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
            </Link>
          );
        })}
      </div>

      {notifs.hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            leftIcon={<ArrowDown />}
            onClick={() => notifs.fetchNextPage()}
            isLoading={notifs.isFetchingNextPage}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
