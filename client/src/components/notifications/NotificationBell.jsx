import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useUnreadCount, useNotifications, useMarkAllRead, useMarkRead } from '@/features/notifications/hooks';
import { Avatar } from '@/components/Avatar';
import { notificationMeta, timeAgo } from '@/features/notifications/meta';
import { cn } from '@/lib/cn';

export function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount(true);
  const notifs = useNotifications({ enabled: open });
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();

  const items = (notifs.data?.pages || []).flatMap((p) => p.data || []);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest?.('[data-notif-menu]')) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  function openItem(n) {
    if (!n.readAt) markOne.mutate(n.id);
    const { to } = notificationMeta(n);
    setOpen(false);
    navigate(to);
  }

  return (
    <div className="relative" data-notif-menu>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 origin-top-right animate-slide-down overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifs.isLoading && <p className="px-4 py-6 text-center text-sm text-slate-400">Loading…</p>}
            {!notifs.isLoading && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</p>
            )}
            {items.map((n) => {
              const { text } = notificationMeta(n);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openItem(n)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70',
                    !n.readAt && 'bg-brand-50/50 dark:bg-brand-950/30',
                  )}
                >
                  <Avatar user={n.actor} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug text-slate-700 dark:text-slate-200">{text}</span>
                    <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </button>
              );
            })}
          </div>

          <Link
            to="/notifications"
            className="block border-t border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-slate-50 dark:border-slate-800 dark:text-brand-300 dark:hover:bg-slate-800"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
