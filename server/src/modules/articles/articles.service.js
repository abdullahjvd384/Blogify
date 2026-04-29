import mongoose from 'mongoose';
import { Article } from '../../models/Article.js';
import { ArticleVersion } from '../../models/ArticleVersion.js';
import { uniqueSlug } from '../../utils/slug.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors.js';

const WORDS_PER_MINUTE = 220;

function computeReadStats(content = '') {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  return {
    word_count: words,
    estimated_read_minutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
  };
}

function autoExcerpt(content = '') {
  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
}

async function slugExists(candidate) {
  return Boolean(await Article.exists({ slug: candidate }));
}

/**
 * Creates a draft article owned by `authorId`. Slug is derived from title and
 * de-duplicated via random suffix on collision.
 */
export async function createDraft(authorId, input) {
  const slug = await uniqueSlug(input.title, slugExists);
  const stats = computeReadStats(input.content);

  const doc = await Article.create({
    author_id: authorId,
    title: input.title,
    slug,
    content: input.content || '',
    excerpt: input.excerpt || autoExcerpt(input.content || ''),
    cover_image_url: input.coverImageUrl ?? null,
    tags: input.tags || [],
    status: 'draft',
    word_count: stats.word_count,
    estimated_read_minutes: stats.estimated_read_minutes,
  });
  return doc.toObject();
}

/**
 * Updates a draft (or republishes a published article into a new draft revision
 * — Phase 2). For MVP: only `draft`, `rejected`, `needs_review` statuses can be
 * edited, and only by the owner.
 */
export async function updateArticle(articleId, actor, patch) {
  const article = await Article.findById(articleId);
  if (!article || article.deleted_at) throw new NotFoundError('Article not found');
  assertCanEdit(article, actor);

  if (patch.title !== undefined && patch.title !== article.title) {
    article.title = patch.title;
    article.slug = await uniqueSlug(patch.title, async (s) =>
      Boolean(await Article.exists({ slug: s, _id: { $ne: article._id } })),
    );
  }
  if (patch.content !== undefined) {
    article.content = patch.content;
    const stats = computeReadStats(patch.content);
    article.word_count = stats.word_count;
    article.estimated_read_minutes = stats.estimated_read_minutes;
    if (!patch.excerpt && !article.excerpt) {
      article.excerpt = autoExcerpt(patch.content);
    }
  }
  if (patch.excerpt !== undefined) article.excerpt = patch.excerpt;
  if (patch.tags !== undefined) article.tags = patch.tags;
  if (patch.coverImageUrl !== undefined) article.cover_image_url = patch.coverImageUrl;

  // Snapshot the previous version when content materially changed.
  if (patch.title !== undefined || patch.content !== undefined || patch.tags !== undefined) {
    article.version += 1;
    await ArticleVersion.create({
      article_id: article._id,
      version: article.version,
      title: article.title,
      content: article.content,
      tags: article.tags,
      edited_by: new mongoose.Types.ObjectId(actor.id),
    });
  }

  await article.save();
  return article.toObject();
}

export async function softDelete(articleId, actor) {
  const article = await Article.findById(articleId);
  if (!article || article.deleted_at) throw new NotFoundError('Article not found');
  assertCanEdit(article, actor);
  article.deleted_at = new Date();
  if (article.status === 'published') {
    article.status = 'unpublished';
    article.unpublished_at = new Date();
  }
  await article.save();
}

/** Marks a draft as `submitted` for moderation. Worker pickup lands Day 4. */
export async function submitForReview(articleId, actor) {
  const article = await Article.findById(articleId);
  if (!article || article.deleted_at) throw new NotFoundError('Article not found');
  assertCanEdit(article, actor);
  if (article.status !== 'draft' && article.status !== 'rejected') {
    throw new ConflictError(`Cannot submit from status: ${article.status}`);
  }
  if (!article.content?.trim()) throw new ValidationError('Article has no content');
  article.status = 'submitted';
  await article.save();
  return article.toObject();
}

/**
 * Public read by slug. Returns only published articles unless the caller is the
 * author or an admin.
 */
export async function getBySlug(slug, actor) {
  const article = await Article.findOne({ slug, deleted_at: null }).lean();
  if (!article) throw new NotFoundError('Article not found');

  if (article.status === 'published') return article;

  const isOwner = actor?.id && article.author_id.toString() === actor.id;
  const isAdmin = actor?.role === 'admin';
  if (isOwner || isAdmin) return article;

  throw new NotFoundError('Article not found');
}

/** Public feed: published articles only, cursor-paginated by _id desc. */
export async function listFeed({ cursor, limit, tag, authorId }) {
  const filter = { status: 'published', deleted_at: null };
  if (tag) filter.tags = tag.toLowerCase();
  if (authorId) filter.author_id = new mongoose.Types.ObjectId(authorId);
  if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };

  const docs = await Article.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  return {
    items,
    cursor: items.length ? items[items.length - 1]._id.toString() : null,
    hasMore,
  };
}

/** Author's own articles (any status). */
export async function listMine(authorId, { cursor, limit, status }) {
  const filter = { author_id: new mongoose.Types.ObjectId(authorId), deleted_at: null };
  if (status) filter.status = status;
  if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };

  const docs = await Article.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  return {
    items,
    cursor: items.length ? items[items.length - 1]._id.toString() : null,
    hasMore,
  };
}

function assertCanEdit(article, actor) {
  if (!actor?.id) throw new ForbiddenError();
  if (actor.role === 'admin') return;
  if (article.author_id.toString() !== actor.id) {
    throw new ForbiddenError('Only the author can modify this article');
  }
}
