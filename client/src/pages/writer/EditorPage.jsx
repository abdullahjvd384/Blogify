import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Send,
  Trash2,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Type,
  Pencil,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/StatusBadge';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { readApiError } from '@/lib/apiError';
import { cn } from '@/lib/cn';

const EDITABLE_STATUSES = new Set(['draft', 'rejected', 'needs_review']);

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
  const readMinutes = Math.max(1, Math.round(wordCount / 200));
  const charCount = content.length;

  const debouncedTitle = useDebouncedValue(title, 800);
  const debouncedContent = useDebouncedValue(content, 800);
  const debouncedExcerpt = useDebouncedValue(excerpt, 800);
  const debouncedTags = useDebouncedValue(tags, 800);
  const debouncedCover = useDebouncedValue(coverUrl, 800);

  const dirtyRef = useRef(false);

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
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 h-10 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-10 h-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }
  if (routeId && loaded.isError) {
    const httpStatus = loaded.error?.response?.status;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <AlertTriangle size={22} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {httpStatus === 404 ? 'Article not found' : 'Could not load article'}
        </h1>
        <Link to="/writer/drafts" className="mt-6">
          <Button variant="outline" leftIcon={<ArrowLeft />}>
            Back to drafts
          </Button>
        </Link>
      </div>
    );
  }

  const lastSavedLabel = updateMut.isPending
    ? 'Saving…'
    : savedAt
    ? `Saved ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Not saved yet';

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-radial-fade" />

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="brand" leftIcon={<Pencil />}>
              {serverArticle ? 'Edit article' : 'New article'}
            </Badge>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
              {serverArticle ? title || '(Untitled)' : 'Start a new article'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {serverArticle && <StatusBadge status={status} />}
              <span className="inline-flex items-center gap-1">
                {updateMut.isPending ? (
                  <Loader2 size={11} className="animate-spin text-brand-500" />
                ) : (
                  <CheckCircle2 size={11} className="text-emerald-500" />
                )}
                {lastSavedLabel}
              </span>
            </div>
          </div>
          <Link
            to="/writer/drafts"
            className="text-sm font-medium text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft size={14} />
              Back to drafts
            </span>
          </Link>
        </div>

        {!editable && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              This article is <span className="font-semibold">{status.replace('_', ' ')}</span>.
              You can only edit articles in draft, rejected, or needs-review state.
            </span>
          </div>
        )}

        {serverArticle?.moderation?.lastVerdict === 'rejected' &&
          serverArticle?.moderation?.reasons?.length > 0 && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={14} /> Rejected by moderation
              </p>
              <ul className="mt-2 list-disc pl-5 text-xs">
                {serverArticle.moderation.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

        {/* Editor card */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
          <div className="space-y-5 p-6 sm:p-8">
            <Field label="Title" htmlFor="title">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!editable}
                placeholder="A compelling title…"
                maxLength={200}
                leftIcon={<Type />}
                className="text-base font-medium"
              />
            </Field>

            <Field label="Cover image URL" htmlFor="cover" hint="Optional. Used as the article hero.">
              <Input
                id="cover"
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                disabled={!editable}
                placeholder="https://images.unsplash.com/…"
                leftIcon={<ImageIcon />}
              />
            </Field>

            <Field label="Tags" hint="Help readers find your work. Press Enter or comma to add.">
              <TagInput value={tags} onChange={setTags} max={8} />
            </Field>

            <Field
              label="Excerpt"
              htmlFor="excerpt"
              hint="A short summary shown on the feed (auto-generated if blank)."
            >
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                disabled={!editable}
                maxLength={280}
                rows={2}
                className={cn(
                  'block w-full resize-none rounded-lg border bg-white px-3.5 py-2 text-sm shadow-soft transition-all duration-200',
                  'placeholder:text-slate-400',
                  'focus:outline-none focus:ring-4',
                  'dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500',
                  'border-slate-200 focus:border-brand-500 focus:ring-brand-500/15 dark:border-slate-800',
                )}
                placeholder="One or two sentences that make the reader click."
              />
            </Field>

            <Field label="Content" htmlFor="content">
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!editable}
                rows={18}
                className={cn(
                  'block w-full resize-y rounded-lg border bg-white px-3.5 py-3 font-mono text-sm leading-relaxed shadow-soft transition-all duration-200',
                  'placeholder:text-slate-400',
                  'focus:outline-none focus:ring-4',
                  'dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500',
                  'border-slate-200 focus:border-brand-500 focus:ring-brand-500/15 dark:border-slate-800',
                )}
                placeholder="Write your article here. Plain text or markdown — both render in the reader."
              />
            </Field>
          </div>

          {/* Footer toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <FileText size={12} />
                {wordCount} words
              </span>
              <span>·</span>
              <span>{charCount} chars</span>
              <span>·</span>
              <span>~{readMinutes} min read</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {serverArticle && (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 />}
                  onClick={handleDelete}
                  isLoading={deleteMut.isPending}
                >
                  Delete
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Save />}
                onClick={handleManualSave}
                disabled={!editable}
                isLoading={createMut.isPending || updateMut.isPending}
              >
                {serverArticle ? 'Save now' : 'Save draft'}
              </Button>
              <Button
                size="sm"
                leftIcon={<Send />}
                onClick={handleSubmit}
                disabled={!editable || !serverArticle}
                isLoading={submitMut.isPending}
              >
                Submit for review
              </Button>
            </div>
          </div>
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
