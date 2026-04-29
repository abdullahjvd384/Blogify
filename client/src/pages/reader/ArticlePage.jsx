import { Link, useParams } from 'react-router-dom';
import { useArticle } from '@/features/articles/hooks';

export default function ArticlePage() {
  const { slug } = useParams();
  const { data: article, isLoading, isError, error } = useArticle(slug);

  if (isLoading) {
    return <p className="mx-auto max-w-3xl px-6 py-16 text-sm text-slate-500">Loading…</p>;
  }

  if (isError) {
    const status = error?.response?.status;
    if (status === 404) {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="text-xl font-semibold">Article not found</h1>
          <Link to="/articles" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
            Back to feed
          </Link>
        </div>
      );
    }
    return (
      <p className="mx-auto max-w-3xl px-6 py-16 text-sm text-red-600">
        Could not load article.
      </p>
    );
  }

  return (
    <article className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span>{article.estimatedReadMinutes} min read</span>
        <span>·</span>
        <span>{article.statsSnapshot?.reads || 0} reads</span>
        {article.tags?.length > 0 && (
          <>
            <span>·</span>
            <span>{article.tags.join(', ')}</span>
          </>
        )}
      </div>
      <div className="prose prose-slate mt-8 max-w-none whitespace-pre-wrap dark:prose-invert">
        {article.content}
      </div>
    </article>
  );
}
