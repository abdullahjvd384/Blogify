import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ChevronDown,
  BookOpen,
  PenLine,
  Shield,
  Sparkles,
  CreditCard,
  Gauge,
  Users,
  Bookmark,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/features/auth/hooks';
import { useMySubscription } from '@/features/subscription/hooks';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/articles', label: 'Read', icon: BookOpen },
  { to: '/following', label: 'Following', icon: Users, requiresAuth: true },
  { to: '/pricing', label: 'Pricing', icon: Sparkles },
  { to: '/writer', label: 'Write', icon: PenLine, requiresRole: 'writer' },
  { to: '/admin', label: 'Admin', icon: Shield, requiresRole: 'admin' },
];

function getInitials(name = '', email = '') {
  const source = (name || email || '').trim();
  if (!source) return 'U';
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || '';
  return (first + second).toUpperCase() || source[0].toUpperCase();
}

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: sub } = useMySubscription();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest?.('[data-user-menu]')) setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      toast.success('Logged out');
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  }

  const visibleItems = navItems.filter((item) => {
    if (item.requiresAuth && !user) return false;
    if (item.requiresRole) {
      if (!user) return false;
      // admin is a superset — always show role-gated items to admin
      if (user.role !== 'admin' && user.role !== item.requiresRole) return false;
    }
    return true;
  });

  const linkClass = ({ isActive }) =>
    cn(
      'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'text-slate-900 dark:text-slate-50'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
    );

  const usage = sub?.usage;
  const planLabel = sub?.plan?.label || (usage?.plan ? usage.plan : null);
  const usageText = usage
    ? usage.limit === null
      ? `${planLabel || 'Unlimited'} · ∞`
      : `${usage.used}/${usage.limit} today`
    : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'glass border-b border-slate-200/60 shadow-soft dark:border-slate-800/60'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {({ isActive }) => (
                <>
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <item.icon className="h-3.5 w-3.5 opacity-80" />
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute inset-0 -z-0 rounded-lg bg-slate-100 dark:bg-slate-800/80" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && usageText && (
            <Link
              to="/pricing"
              title={`Daily reads on ${planLabel || usage.plan}`}
              className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 lg:inline-flex dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
            >
              <Gauge size={12} />
              {usageText}
            </Link>
          )}
          <ThemeToggle className="hidden sm:inline-flex" />

          {user ? (
            <div className="relative" data-user-menu>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className={cn(
                  'group inline-flex items-center gap-2 rounded-full p-1 pr-2 transition-colors',
                  'hover:bg-slate-100 dark:hover:bg-slate-800/80',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                )}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-semibold text-white shadow-soft"
                  aria-hidden
                >
                  {getInitials(user.name, user.email)}
                </span>
                <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 dark:text-slate-200 sm:inline">
                  {user.name || user.email}
                </span>
                <ChevronDown
                  size={14}
                  className={cn(
                    'hidden text-slate-400 transition-transform duration-200 sm:inline',
                    menuOpen && 'rotate-180',
                  )}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-72 origin-top-right animate-slide-down rounded-2xl border border-slate-200 bg-white p-2 shadow-card dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-semibold text-white">
                      {getInitials(user.name, user.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {user.name || 'Reader'}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {usageText && (
                    <Link
                      to="/pricing"
                      className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-800 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-brand-950/30"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Gauge size={13} />
                        {planLabel || 'Plan'}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {usageText}
                      </span>
                    </Link>
                  )}

                  <div className="my-2 h-px bg-slate-200 dark:bg-slate-800" />

                  <Link
                    to={`/u/${user.username || user.id}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <UserIcon size={15} className="text-slate-400" />
                    Your profile
                  </Link>
                  <Link
                    to="/articles"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <BookOpen size={15} className="text-slate-400" />
                    Browse articles
                  </Link>
                  <Link
                    to="/saved"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Bookmark size={15} className="text-slate-400" />
                    Saved articles
                  </Link>
                  {(user.role === 'writer' || user.role === 'admin') && (
                    <Link
                      to="/writer/drafts"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <PenLine size={15} className="text-slate-400" />
                      Writer studio
                    </Link>
                  )}
                  <Link
                    to="/account/settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <UserIcon size={15} className="text-slate-400" />
                    Account settings
                  </Link>
                  <Link
                    to="/account/subscription"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <CreditCard size={15} className="text-slate-400" />
                    My subscription
                  </Link>
                  <Link
                    to="/pricing"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <CreditCard size={15} className="text-slate-400" />
                    Plans & pricing
                  </Link>
                  {user.role === 'admin' && (
                    <>
                      <Link
                        to="/admin/moderation"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/50"
                      >
                        <Shield size={15} />
                        Moderation queue
                      </Link>
                      <Link
                        to="/admin/users"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/50"
                      >
                        <Shield size={15} />
                        User management
                      </Link>
                      <Link
                        to="/admin/payments"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/50"
                      >
                        <Shield size={15} />
                        Payment review
                      </Link>
                    </>
                  )}

                  <div className="my-2 h-px bg-slate-200 dark:bg-slate-800" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logout.isPending}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/50"
                  >
                    <LogOut size={15} />
                    {logout.isPending ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" leftIcon={<UserIcon />}>
                  Get started
                </Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200/70 bg-white/95 backdrop-blur md:hidden dark:border-slate-800/70 dark:bg-slate-950/95">
          <div className="space-y-1 px-4 py-3">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                  )
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}

            {user && usageText && (
              <Link
                to="/pricing"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-600 ring-1 ring-inset ring-slate-200 dark:text-slate-300 dark:ring-slate-800"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Gauge size={13} />
                  {planLabel || 'Plan'}
                </span>
                <span className="font-medium">{usageText}</span>
              </Link>
            )}

            {!user && (
              <div className="mt-2 grid grid-cols-2 gap-2 pt-2">
                <Link to="/login">
                  <Button variant="secondary" size="md" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="md" className="w-full">
                    Get started
                  </Button>
                </Link>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
