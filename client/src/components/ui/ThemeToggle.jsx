import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  window.localStorage.setItem('theme', theme);
}

export function ThemeToggle({ className }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'group relative inline-flex h-9 w-9 items-center justify-center rounded-lg',
        'text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900',
        'dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        className,
      )}
    >
      <Sun
        className={cn(
          'h-4.5 w-4.5 transition-all duration-300',
          isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
          'absolute',
        )}
        size={18}
      />
      <Moon
        className={cn(
          'h-4.5 w-4.5 transition-all duration-300',
          isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0',
          'absolute',
        )}
        size={18}
      />
    </button>
  );
}
