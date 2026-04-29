import { Link } from 'react-router-dom';

export function ArticleCard({ article }) {
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
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span>{article.estimatedReadMinutes} min read</span>
        <span>·</span>
        <span>{article.statsSnapshot?.reads || 0} reads</span>
        {article.tags?.length > 0 && (
          <>
            <span>·</span>
            <span className="truncate">{article.tags.join(', ')}</span>
          </>
        )}
      </div>
    </Link>
  );
}
