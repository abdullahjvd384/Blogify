import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useArticleFeed } from '@/features/articles/hooks';
import { ArticleCard } from '@/components/ArticleCard';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const feed = useArticleFeed({ limit: 3 });

  return (
    <div>
      <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Read what writers want to write.
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
            A no-noise blog platform with AI-moderated submissions and a quota that respects
            your attention.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/articles">
              <Button>Browse articles</Button>
            </Link>
            {!user && (
              <Link to="/signup">
                <Button variant="secondary">Create account</Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent</h2>
          <Link to="/articles" className="text-sm text-brand-600 hover:underline">
            See all →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {feed.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
          {feed.data?.data?.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
