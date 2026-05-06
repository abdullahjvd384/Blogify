import { Link } from 'react-router-dom';

export function ArticleCard({ article }) {
  const stats = article.statsSnapshot || {};
  const score = (stats.upvotes || 0) - (stats.downvotes || 0);

  return (
    <Link
      to={`/articles/${article.slug}`}
      className="block rounded-lg border border-slate-200 p-4 transition-colors hover:border-brand-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
    >
      <h3 className="text-lg font-semibold tracking-tight">{article.title}</h3>
      {article.excerpt && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
          {article.excerpt}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {article.author?.name && (
          <span>
            by <span className="font-medium text-slate-700 dark:text-slate-300">{article.author.name}</span>
          </span>
        )}
        <span>{article.estimatedReadMinutes} min read</span>
        <span>{stats.reads || 0} reads</span>
        <span>
          {score >= 0 ? '+' : ''}
          {score} score
        </span>
        {article.tags?.length > 0 && <span className="truncate">{article.tags.join(', ')}</span>}
      </div>
    </Link>
  );
}
