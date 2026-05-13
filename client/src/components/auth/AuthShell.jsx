import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Zap, Quote } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const bullets = [
  { icon: ShieldCheck, text: 'AI-moderated submissions keep your feed signal-only.' },
  { icon: Zap, text: 'Lightning-fast reading with focused, distraction-free layouts.' },
  { icon: Sparkles, text: 'A quota that respects attention — no doomscrolling.' },
];

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-2">
      {/* Form column */}
      <div className="relative flex items-center justify-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-fade lg:hidden" />
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="lg" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}

          <div className="mt-8">{children}</div>

          {footer && (
            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</p>
          )}
        </div>
      </div>

      {/* Brand column */}
      <div className="relative isolate hidden overflow-hidden lg:flex">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-10 mix-blend-overlay" />
        <div className="pointer-events-none absolute -right-20 top-1/4 -z-10 h-80 w-80 animate-blob rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-10 -z-10 h-80 w-80 animate-blob rounded-full bg-accent-400/30 blur-3xl" style={{ animationDelay: '-6s' }} />

        <div className="relative flex w-full flex-col justify-between p-12 text-white">
          <Link to="/" className="inline-block">
            <span className="inline-flex items-center gap-2">
              <Logo withText={false} size="md" />
              <span className="font-display text-lg font-bold tracking-tight">Blogify</span>
            </span>
          </Link>

          <div>
            <h2 className="max-w-md font-display text-3xl font-bold leading-tight tracking-tight text-balance xl:text-4xl">
              Where deliberate writing meets focused reading.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
              Join thousands of writers shipping essays worth your attention.
            </p>

            <ul className="mt-8 space-y-3">
              {bullets.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 ring-1 ring-inset ring-white/20 backdrop-blur">
                    <Icon size={14} />
                  </span>
                  <span className="text-sm text-white/90">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure className="rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/15 backdrop-blur">
            <Quote className="h-5 w-5 text-white/60" />
            <blockquote className="mt-2 text-sm leading-6 text-white/90">
              “Finally a platform where the quality bar matches the writers. The
              AI moderation cuts spam, not voices.”
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white ring-1 ring-inset ring-white/30">
                HK
              </span>
              <div>
                <p className="text-xs font-semibold">Hira Khan</p>
                <p className="text-[11px] text-white/70">Senior writer at Hashnode</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
