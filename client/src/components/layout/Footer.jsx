import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'Read articles', href: '/articles' },
      { label: 'Become a writer', href: '/signup' },
      { label: 'Quotas & limits', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '/articles' },
      { label: 'Careers', href: '#' },
      { label: 'Press kit', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help center', href: '#' },
      { label: 'Editorial guidelines', href: '#' },
      { label: 'API docs', href: '#' },
      { label: 'Community', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of service', href: '#' },
      { label: 'Privacy policy', href: '#' },
      { label: 'Cookie policy', href: '#' },
      { label: 'Acceptable use', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Logo size="lg" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-400">
              A no-noise blog platform with AI-moderated submissions and a quota that
              respects your attention.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Github, label: 'GitHub' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' },
                { Icon: Mail, label: 'Email' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:ring-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-slate-600 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Blogify. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            Built with <Heart size={12} className="text-rose-500" fill="currentColor" /> for the WebProg project
          </p>
        </div>
      </div>
    </footer>
  );
}
