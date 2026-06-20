import { Link, useNavigate } from 'react-router-dom';
import { Clock, Eye, ArrowUpRight, ArrowBigUp, ArrowBigDown, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { profilePath } from '@/lib/profile';

function gradientFor(seed = '') {
  // Warm, editorial cover placeholders that stay within the brand palette
  // (greens, teals, ambers, warm rose) so the feed reads as one cohesive set.
  const palettes = [
    'from-brand-500 via-brand-600 to-accent-600',
    'from-emerald-500 via-teal-500 to-accent-600',
    'from-amber-500 via-orange-500 to-rose-500',
    'from-teal-500 via-emerald-600 to-brand-600',
    'from-rose-500 via-amber-500 to-orange-500',
    'from-accent-500 via-teal-600 to-brand-700',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palettes[hash % palettes.length];
}

function getAuthorInitials(article) {
  const source = article.authorName || article.author?.name || article.author?.email || 'Anonymous';
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || '';
  return (first + second).toUpperCase() || source[0]?.toUpperCase() || 'A';
}

export function ArticleCard({ article, variant = 'default' }) {
  const navigate = useNavigate();
  const grad = gradientFor(article.slug || article.title);
  const tags = (article.tags || []).slice(0, 3);
  const stats = article.statsSnapshot || {};
  const reads = stats.reads || 0;
  const score = (stats.upvotes || 0) - (stats.downvotes || 0);
  const date = article.publishedAt || article.createdAt;
  const authorName = article.authorName || article.author?.name || 'Anonymous';

  // The whole card is a <Link>; nesting another <Link> for the author is invalid,
  // so intercept the click and navigate manually.
  function goToAuthor(e) {
    if (!article.author) return;
    e.preventDefault();
    e.stopPropagation();
    navigate(profilePath(article.author));
  }

  return (
    <Link
      to={`/articles/${article.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift',
        'dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-brand-700',
        variant === 'compact' ? 'p-5' : 'p-0',
      )}
    >
      {variant !== 'compact' && (
        <div
          className={cn(
            'relative h-40 w-full overflow-hidden bg-gradient-to-br',
            grad,
          )}
        >
          {article.coverImageUrl ? (
            <img
              src={article.coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-95"
              loading="lazy"
            />
          ) : null}
          <div className="absolute inset-0 bg-grid opacity-20 mix-blend-overlay" />
          <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute left-4 top-4 inline-flex max-w-[80%] items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm ring-1 ring-inset ring-white/20">
            {tags[0] || 'Article'}
          </div>
          <ArrowUpRight
            className="absolute right-4 top-4 h-5 w-5 text-white/90 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
      )}

      <div className={cn('flex flex-1 flex-col gap-3', variant !== 'compact' && 'p-5')}>
        {article.memberOnly && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Crown size={11} /> Member
          </span>
        )}
        <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {article.title}
        </h3>

        {article.excerpt && (
          <p className="line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {article.excerpt}
          </p>
        )}

        {tags.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(variant === 'compact' ? 0 : 1).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div
            className={cn(
              'flex min-w-0 items-center gap-2.5',
              article.author && 'cursor-pointer',
            )}
            onClick={goToAuthor}
            role={article.author ? 'link' : undefined}
          >
            <span
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-[11px] font-semibold text-white shadow-soft',
                grad,
              )}
              aria-hidden
            >
              {article.author?.avatarUrl ? (
                <img
                  src={article.author.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                getAuthorInitials(article)
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-700 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300">
                {authorName}
              </p>
              {date && (
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-500">
                  {new Date(date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium tabular-nums',
                score > 0 && 'text-emerald-600 dark:text-emerald-400',
                score < 0 && 'text-rose-600 dark:text-rose-400',
              )}
              title="Vote score"
            >
              {score >= 0 ? <ArrowBigUp size={13} /> : <ArrowBigDown size={13} />}
              {score}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {article.estimatedReadMinutes || 1}m
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye size={12} />
              {reads}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
