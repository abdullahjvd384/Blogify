import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useCreateArticle,
  useUpdateArticle,
  useSubmitArticle,
  useDeleteArticle,
} from '@/features/articles/hooks';
import { articlesApi } from '@/features/articles/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { TagInput } from '@/components/ui/TagInput';
import { StatusBadge } from '@/components/StatusBadge';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { readApiError } from '@/lib/apiError';

const EDITABLE_STATUSES = new Set(['draft', 'rejected', 'needs_review']);

/**
 * Editor route. Two modes:
 *   - /writer/new        — empty form, creates the article on first save (manual).
 *   - /writer/edit/:id   — loads the article and autosaves changes.
 *
 * Autosave is debounced and only fires for editable statuses, so opening a
 * published article in edit mode doesn't accidentally rewrite live content.
 */
export default function EditorPage() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const loaded = useQuery({
    queryKey: ['article-draft', routeId],
    queryFn: () => articlesApi.getMineById(routeId),
    enabled: Boolean(routeId),
    retry: false,
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState([]);
  const [coverUrl, setCoverUrl] = useState('');

  const [serverArticle, setServerArticle] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (loaded.data) {
      const a = loaded.data;
      setServerArticle(a);
      setTitle(a.title || '');
      setContent(a.content || '');
      setExcerpt(a.excerpt || '');
      setTags(a.tags || []);
      setCoverUrl(a.coverImageUrl || '');
      setSavedAt(a.updatedAt ? new Date(a.updatedAt) : null);
    }
  }, [loaded.data]);

  const createMut = useCreateArticle();
  const updateMut = useUpdateArticle(serverArticle?.id);
  const submitMut = useSubmitArticle();
  const deleteMut = useDeleteArticle();

  const status = serverArticle?.status || 'draft';
  const editable = !serverArticle || EDITABLE_STATUSES.has(status);

  const wordCount = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content],
  );

  const debouncedTitle = useDebouncedValue(title, 800);
  const debouncedContent = useDebouncedValue(content, 800);
  const debouncedExcerpt = useDebouncedValue(excerpt, 800);
  const debouncedTags = useDebouncedValue(tags, 800);
  const debouncedCover = useDebouncedValue(coverUrl, 800);

  const dirtyRef = useRef(false);

  // Mark dirty whenever a field changes; reset when we successfully save.
  useEffect(() => {
    if (!serverArticle) return;
    const same =
      title === (serverArticle.title || '') &&
      content === (serverArticle.content || '') &&
      excerpt === (serverArticle.excerpt || '') &&
      arraysEqual(tags, serverArticle.tags || []) &&
      coverUrl === (serverArticle.coverImageUrl || '');
    dirtyRef.current = !same;
  }, [title, content, excerpt, tags, coverUrl, serverArticle]);

  // Autosave existing article when debounced values change.
  useEffect(() => {
    if (!serverArticle?.id || !editable || !dirtyRef.current) return;
    if (!debouncedTitle.trim()) return;
    const patch = {
      title: debouncedTitle,
      content: debouncedContent,
      excerpt: debouncedExcerpt || undefined,
      tags: debouncedTags,
      coverImageUrl: debouncedCover.trim() ? debouncedCover.trim() : null,
    };
    updateMut.mutate(patch, {
      onSuccess: (updated) => {
        setServerArticle(updated);
        setSavedAt(new Date());
        dirtyRef.current = false;
      },
      onError: (err) => toast.error(readApiError(err)),
    });
    // updateMut intentionally omitted — re-creating on each render is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent, debouncedExcerpt, debouncedTags, debouncedCover]);

  async function handleManualSave() {
    if (!title.trim()) {
      toast.error('Add a title first');
      return;
    }
    if (!serverArticle) {
      try {
        const created = await createMut.mutateAsync({
          title: title.trim(),
          content,
          ...(excerpt ? { excerpt } : {}),
          tags,
          ...(coverUrl.trim() ? { coverImageUrl: coverUrl.trim() } : {}),
        });
        toast.success('Draft saved');
        setServerArticle(created);
        setSavedAt(new Date());
        navigate(`/writer/edit/${created.id}`, { replace: true });
      } catch (err) {
        toast.error(readApiError(err));
      }
      return;
    }
    try {
      const updated = await updateMut.mutateAsync({
        title,
        content,
        excerpt: excerpt || undefined,
        tags,
        coverImageUrl: coverUrl.trim() ? coverUrl.trim() : null,
      });
      setServerArticle(updated);
      setSavedAt(new Date());
      dirtyRef.current = false;
      toast.success('Saved');
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  async function handleSubmit() {
    if (!serverArticle) {
      toast.error('Save the draft first');
      return;
    }
    if (!content.trim()) {
      toast.error('Article has no content');
      return;
    }
    try {
      // Flush any pending edits before submitting.
      if (dirtyRef.current) await handleManualSave();
      const updated = await submitMut.mutateAsync(serverArticle.id);
      setServerArticle(updated);
      toast.success('Submitted for review');
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  async function handleDelete() {
    if (!serverArticle) {
      navigate('/writer/drafts');
      return;
    }
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
      await deleteMut.mutateAsync(serverArticle.id);
      toast.success('Deleted');
      navigate('/writer/drafts');
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  if (routeId && loaded.isLoading) {
    return <p className="mx-auto max-w-3xl px-6 py-12 text-sm text-slate-500">Loading…</p>;
  }
  if (routeId && loaded.isError) {
    const status = loaded.error?.response?.status;
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-xl font-semibold">
          {status === 404 ? 'Article not found' : 'Could not load article'}
        </h1>
        <Link
          to="/writer/drafts"
          className="mt-4 inline-block text-sm text-brand-600 hover:underline"
        >
          Back to drafts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {serverArticle ? 'Edit article' : 'New article'}
          </h1>
          {serverArticle && <StatusBadge status={status} />}
        </div>
        <Link to="/writer/drafts" className="text-sm text-slate-500 hover:underline">
          Back to drafts
        </Link>
      </div>

      {!editable && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          This article is {status.replace('_', ' ')}. You can only edit articles in draft, rejected,
          or needs-review state.
        </p>
      )}

      {serverArticle?.moderation?.lastVerdict === 'rejected' &&
        serverArticle?.moderation?.reasons?.length > 0 && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            <p className="font-medium">Rejected by moderation</p>
            <ul className="mt-1 list-disc pl-5">
              {serverArticle.moderation.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

      <div className="mt-6 space-y-4">
        <Field label="Title" htmlFor="title">
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!editable}
            placeholder="A compelling title…"
            maxLength={200}
          />
        </Field>

        <Field label="Cover image URL" htmlFor="cover" hint="Optional. Must be a valid URL.">
          <Input
            id="cover"
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            disabled={!editable}
            placeholder="https://…"
          />
        </Field>

        <Field label="Tags" hint="Press Enter or comma to add. Up to 8.">
          <TagInput value={tags} onChange={setTags} max={8} />
        </Field>

        <Field
          label="Excerpt"
          htmlFor="excerpt"
          hint="Short summary shown on the feed (auto-generated if blank)."
        >
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            disabled={!editable}
            maxLength={280}
            rows={2}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="One or two sentences…"
          />
        </Field>

        <Field label="Content" htmlFor="content">
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!editable}
            rows={20}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-relaxed shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Write your article here. Plain text or markdown — both render in the reader."
          />
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="text-xs text-slate-500">
          {wordCount} words
          {savedAt && (
            <>
              <span className="mx-2">·</span>
              <span>
                {updateMut.isPending ? 'Saving…' : `Saved ${savedAt.toLocaleTimeString()}`}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {serverArticle && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteMut.isPending}
            >
              Delete
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleManualSave}
            disabled={!editable}
            isLoading={createMut.isPending || updateMut.isPending}
          >
            {serverArticle ? 'Save now' : 'Save draft'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!editable || !serverArticle}
            isLoading={submitMut.isPending}
          >
            Submit for review
          </Button>
        </div>
      </div>
    </div>
  );
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}
