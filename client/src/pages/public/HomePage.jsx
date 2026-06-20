import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  PenLine,
  BookOpen,
  Coins,
  CheckCircle2,
  Star,
  Quote,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useArticleFeed } from '@/features/articles/hooks';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const features = [
  {
    icon: ShieldCheck,
    title: 'AI-moderated quality',
    desc: 'Every submission is screened for spam, harm, and low-effort content so your feed stays signal-only.',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Coins,
    title: 'A model that pays writers',
    desc: 'Membership unlocks every story and shares revenue with the writers you actually read — not the loudest engagement bait.',
    accent: 'from-brand-500 to-accent-500',
  },
  {
    icon: Zap,
    title: 'Lightning-fast reading',
    desc: 'Optimized payloads, prefetched routes, and a focused layout — read more, wait less.',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    icon: PenLine,
    title: 'A writer-first editor',
    desc: 'Distraction-free composition, autosave, and an editorial workflow that respects your craft.',
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    icon: BookOpen,
    title: 'Yours, never algorithmic',
    desc: 'Follow writers and topics you choose. Your feed is built from your taste — not the loudest engagement bait.',
    accent: 'from-amber-500 to-rose-500',
  },
  {
    icon: Sparkles,
    title: 'Built for the modern web',
    desc: 'Dark mode, keyboard-first, accessible by default. The kind of app you actually enjoy opening.',
    accent: 'from-teal-500 to-emerald-600',
  },
];

const stats = [
  { label: 'Articles published', value: '12k+' },
  { label: 'Active writers', value: '850' },
  { label: 'Avg. read score', value: '4.8★' },
  { label: 'Spam blocked', value: '99.4%' },
];

const testimonials = [
  {
    name: 'Hira Khan',
    role: 'Senior writer at Hashnode',
    quote:
      'Finally a platform where the quality bar matches the writers. The AI moderation actually cuts spam, not voices.',
  },
  {
    name: 'Daniel Cruz',
    role: 'Indie developer',
    quote:
      'Reading here feels intentional. The quota and the clean layout pushed my retention through the roof.',
  },
  {
    name: 'Aisha Rahman',
    role: 'Editor, The Forge',
    quote:
      "It's the first reader app that respects my time. No infinite scroll, no engagement traps — just words.",
  },
];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const feed = useArticleFeed({ limit: 6 });
  const articles = (feed.data?.pages?.[0]?.data || []).slice(0, 6);

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-fade" />
        <div className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[420px] overflow-hidden">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 animate-blob rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-700/30" />
          <div className="absolute left-1/3 top-10 h-72 w-72 animate-blob rounded-full bg-accent-400/20 blur-3xl dark:bg-accent-700/30" style={{ animationDelay: '-4s' }} />
          <div className="absolute right-1/4 top-16 h-72 w-72 animate-blob rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-700/25" style={{ animationDelay: '-8s' }} />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]" />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in">
              <a
                href="#features"
                className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-xs font-medium text-slate-700 shadow-soft backdrop-blur transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
              >
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                New · AI-moderated submissions are live
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            <h1 className="mt-6 animate-fade-in font-display text-4xl font-bold tracking-tight text-slate-900 text-balance sm:text-6xl lg:text-7xl dark:text-slate-50" style={{ animationDelay: '0.05s' }}>
              Read what writers <span className="gradient-text">want to write.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl animate-fade-in text-base leading-7 text-slate-600 text-pretty sm:text-lg dark:text-slate-400" style={{ animationDelay: '0.1s' }}>
              A no-noise blog platform with AI-moderated submissions and zero
              algorithmic noise. Read free without an account, follow writers you
              love, and publish ideas worth reading.
            </p>

            <div className="mt-8 flex animate-fade-in flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '0.15s' }}>
              <Link to="/articles">
                <Button size="lg" rightIcon={<ArrowRight />}>
                  Browse articles
                </Button>
              </Link>
              {!user ? (
                <Link to="/signup">
                  <Button size="lg" variant="secondary" leftIcon={<Sparkles />}>
                    Create account
                  </Button>
                </Link>
              ) : (
                <Link to="/writer/new">
                  <Button size="lg" variant="secondary" leftIcon={<PenLine />}>
                    Start writing
                  </Button>
                </Link>
              )}
            </div>

            <ul className="mt-8 flex animate-fade-in flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400" style={{ animationDelay: '0.2s' }}>
              {[
                'Free to read — no account needed',
                'Members read everything',
                'No algorithm. Ever.',
              ].map((line) => (
                <li key={line} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* App mockup */}
          <div className="relative mx-auto mt-16 max-w-5xl animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-1.5 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  blogify.app/articles
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className={`h-20 bg-gradient-to-br ${['from-brand-500 to-accent-500', 'from-amber-500 to-rose-500', 'from-emerald-500 to-teal-500'][i]}`} />
                    <div className="space-y-2 p-3">
                      <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-2.5 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-x-4 -bottom-6 -z-10 h-24 rounded-[2rem] bg-gradient-to-r from-brand-500/20 via-accent-500/20 to-brand-500/20 blur-2xl" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-12 sm:grid-cols-4 sm:px-6 lg:px-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="brand" leftIcon={<Sparkles />}>Features</Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance sm:text-4xl dark:text-slate-50">
            Built to make reading and writing feel <span className="gradient-text">deliberate</span>.
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-400">
            We strip the engagement traps out of publishing and put the work back at the center.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-brand-700"
            >
              <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow-lift`}>
                <f.icon size={20} />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {f.desc}
              </p>
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-brand-200/0 to-accent-200/0 blur-2xl transition-all duration-500 group-hover:from-brand-200/40 group-hover:to-accent-200/40 dark:group-hover:from-brand-900/40 dark:group-hover:to-accent-900/40" />
            </div>
          ))}
        </div>
      </section>

      {/* RECENT */}
      <section className="bg-slate-50/60 py-20 dark:bg-slate-900/40 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge variant="accent" leftIcon={<BookOpen />}>Latest reads</Badge>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
                Fresh from the community
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                Hand-picked essays and tutorials posted this week. Spend the next 10 minutes wisely.
              </p>
            </div>
            <Link to="/articles">
              <Button variant="outline" size="md" rightIcon={<ArrowRight />}>
                See all articles
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {feed.isLoading &&
              Array.from({ length: 3 }).map((_, i) => <ArticleCardSkeleton key={i} />)}

            {!feed.isLoading && articles.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Nothing published yet — be the first to share an article.
              </div>
            )}

            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="warning" leftIcon={<Star />}>Loved by writers</Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance sm:text-4xl dark:text-slate-50">
            Readers and creators who chose <span className="gradient-text">signal over noise</span>.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/60"
            >
              <Quote className="absolute right-5 top-5 h-7 w-7 text-brand-100 dark:text-brand-900" />
              <div className="flex gap-0.5 text-amber-400" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-semibold text-white">
                  {t.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 p-10 shadow-lift sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20 mix-blend-overlay" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 animate-blob rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 animate-blob rounded-full bg-white/10 blur-3xl" style={{ animationDelay: '-6s' }} />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
                Ready to publish work worth reading?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-50/90 sm:text-base">
                Create your free account and ship your first essay in minutes. No
                credit card. No noise. Just a clean canvas and an audience that
                shows up.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {!user ? (
                <>
                  <Link to="/signup">
                    <Button size="lg" variant="secondary" rightIcon={<ArrowRight />} className="w-full sm:w-auto">
                      Get started — free
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="ghost" className="w-full text-white hover:bg-white/10 sm:w-auto">
                      Sign in
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/writer/new">
                  <Button size="lg" variant="secondary" leftIcon={<PenLine />} className="w-full sm:w-auto">
                    Open Writer Studio
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
