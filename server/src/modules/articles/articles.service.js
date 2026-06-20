import mongoose from 'mongoose';
import { Article } from '../../models/Article.js';
import { ArticleVersion } from '../../models/ArticleVersion.js';
import { Vote } from '../../models/Vote.js';
import { Follow } from '../../models/Follow.js';
import { TagFollow } from '../../models/TagFollow.js';
import { User } from '../../models/User.js';
import { Subscription } from '../../models/Subscription.js';
import { uniqueSlug } from '../../utils/slug.js';
import { sanitizeArticleHtml } from '../../utils/sanitizeHtml.js';
import { htmlToText } from '../../utils/htmlToText.js';
import { enqueueModeration } from '../../queues/moderation.js';
import { consumeMemberStory } from '../../services/meter.js';
import { isMemberSub } from '../../services/membership.js';
import { logger } from '../../config/logger.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  QuotaExceededError,
  UnauthorizedError,
  ValidationError,
} from '../../utils/errors.js';

const WORDS_PER_MINUTE = 220;

function computeReadStats(text = '') {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    word_count: words,
    estimated_read_minutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
  };
}

function autoExcerpt(text = '') {
  return text.replace(/\s+/g, ' ').trim().slice(0, 280);
}

/**
 * Normalizes incoming rich-text content for storage: sanitizes the HTML (the
 * security boundary), derives cached plaintext for excerpt/word-count/moderation,
 * and computes read stats. Content is always stored as sanitized HTML going
 * forward (content_format 'html'); legacy 'plain' rows render untouched.
 */
function processContent(rawContent = '') {
  const html = sanitizeArticleHtml(rawContent || '');
  const text = htmlToText(html);
  return { html, text, stats: computeReadStats(text) };
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
  const { html, text, stats } = processContent(input.content || '');

  const doc = await Article.create({
    author_id: authorId,
    title: input.title,
    slug,
    content: html,
    content_format: 'html',
    content_text: text,
    excerpt: input.excerpt || autoExcerpt(text),
    cover_image_url: input.coverImageUrl ?? null,
    member_only: Boolean(input.memberOnly),
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
    const { html, text, stats } = processContent(patch.content);
    article.content = html;
    article.content_format = 'html';
    article.content_text = text;
    article.word_count = stats.word_count;
    article.estimated_read_minutes = stats.estimated_read_minutes;
    if (!patch.excerpt && !article.excerpt) {
      article.excerpt = autoExcerpt(text);
    }
  }
  if (patch.excerpt !== undefined) article.excerpt = patch.excerpt;
  if (patch.tags !== undefined) article.tags = patch.tags;
  if (patch.coverImageUrl !== undefined) article.cover_image_url = patch.coverImageUrl;
  if (patch.memberOnly !== undefined) article.member_only = patch.memberOnly;

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

/**
 * Marks a draft as `submitted` and enqueues a moderation job.
 *
 * The article is saved before enqueue so the worker (running in a separate
 * process) can always find the row. If enqueue fails we log but don't fail
 * the request — a separate sweeper can pick up `submitted` rows that have
 * been stuck for too long.
 */
export async function submitForReview(articleId, actor) {
  const article = await Article.findById(articleId);
  if (!article || article.deleted_at) throw new NotFoundError('Article not found');
  assertCanEdit(article, actor);
  if (article.status !== 'draft' && article.status !== 'rejected') {
    throw new ConflictError(`Cannot submit from status: ${article.status}`);
  }
  const bodyText = article.content_text?.trim() || htmlToText(article.content).trim();
  if (!bodyText) throw new ValidationError('Article has no content');
  article.status = 'submitted';
  await article.save();

  try {
    await enqueueModeration(article._id);
  } catch (err) {
    logger.error({ err, articleId: article._id.toString() }, 'failed to enqueue moderation');
  }

  return article.toObject();
}

/**
 * Public read by slug. Returns only published articles unless the caller is the
 * author or an admin. Includes author summary and (when actor is logged in)
 * the caller's current vote so the article page can render in one round trip.
 *
 * Access model (Medium-style):
 *   - Free (not member_only) stories are open to everyone, no meter.
 *   - Member-only stories: author/admin always allowed; active members allowed;
 *     non-members are metered (N free member-only stories/month) and get a 402
 *     once the meter is exhausted.
 */
export async function getBySlug(slug, actor) {
  const article = await Article.findOne({ slug, deleted_at: null }).lean();
  if (!article) throw new NotFoundError('Article not found');

  const isOwner = actor?.id && article.author_id.toString() === actor.id;
  const isAdmin = actor?.role === 'admin';
  if (article.status !== 'published' && !isOwner && !isAdmin) {
    throw new NotFoundError('Article not found');
  }

  // Anonymous visitors can read free stories, but member-only stories require at
  // least a free account so the monthly meter applies. Prompt anonymous readers
  // to sign in instead of silently bypassing the paywall.
  if (article.status === 'published' && article.member_only && !actor?.id) {
    throw new UnauthorizedError('Log in to read member-only stories');
  }

  let usage = null;
  const needsMeter =
    article.status === 'published' && article.member_only && actor?.id && !isOwner && !isAdmin;
  if (needsMeter) {
    const [sub, user] = await Promise.all([
      Subscription.findOne(
        { user_id: actor.id },
        { plan: 1, status: 1, current_period_end: 1 },
      ).lean(),
      User.findById(actor.id, { timezone: 1 }).lean(),
    ]);
    if (!isMemberSub(sub)) {
      const tz = user?.timezone || 'Asia/Karachi';
      const result = await consumeMemberStory(actor.id, article._id.toString(), tz);
      if (result.allowed === false) {
        throw new QuotaExceededError('Free member-story limit reached', {
          used: result.used,
          limit: result.limit,
          remaining: 0,
          resetAt: result.resetAt,
          memberOnly: true,
        });
      }
      usage = result;
    }
  }

  const enriched = await attachAuthors([article]);
  if (actor?.id && article.status === 'published') {
    enriched[0].my_vote = await readMyVote(actor.id, article._id);
  }
  if (usage) enriched[0].usage = usage;
  return enriched[0];
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
  const enriched = await attachAuthors(items);
  return {
    items: enriched,
    cursor: enriched.length ? enriched[enriched.length - 1]._id.toString() : null,
    hasMore,
  };
}

/**
 * Feed of published articles from authors the user follows, newest first.
 * Returns an empty page when the user follows nobody.
 */
export async function listFollowingFeed(userId, { cursor, limit }) {
  const edges = await Follow.find(
    { follower_id: new mongoose.Types.ObjectId(userId) },
    { following_id: 1 },
  ).lean();
  if (!edges.length) return { items: [], cursor: null, hasMore: false };

  const authorIds = edges.map((e) => e.following_id);
  const filter = { status: 'published', deleted_at: null, author_id: { $in: authorIds } };
  if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };

  const docs = await Article.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  const enriched = await attachAuthors(items);
  return {
    items: enriched,
    cursor: enriched.length ? enriched[enriched.length - 1]._id.toString() : null,
    hasMore,
  };
}

/**
 * Personalized "For You" feed: published articles from authors the user follows
 * OR carrying tags the user follows, newest first. Falls back to the general
 * latest feed when the user follows nobody and no tags.
 */
export async function listForYou(userId, { cursor, limit }) {
  const uid = new mongoose.Types.ObjectId(userId);
  const [follows, tagRows] = await Promise.all([
    Follow.find({ follower_id: uid }, { following_id: 1 }).lean(),
    TagFollow.find({ user_id: uid }, { tag: 1 }).lean(),
  ]);
  const authorIds = follows.map((f) => f.following_id);
  const tags = tagRows.map((t) => t.tag);

  if (!authorIds.length && !tags.length) {
    return listFeed({ cursor, limit });
  }

  const or = [];
  if (authorIds.length) or.push({ author_id: { $in: authorIds } });
  if (tags.length) or.push({ tags: { $in: tags } });

  const filter = { status: 'published', deleted_at: null, $or: or };
  if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };

  const docs = await Article.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  const enriched = await attachAuthors(items);
  return {
    items: enriched,
    cursor: enriched.length ? enriched[enriched.length - 1]._id.toString() : null,
    hasMore,
  };
}

/**
 * Adds an `author` summary ({ id, name, role }) to each article doc. Done in
 * one query rather than $lookup so we can keep the read pipeline simple.
 */
export async function attachAuthors(docs) {
  if (!docs.length) return docs;
  const ids = [...new Set(docs.map((d) => d.author_id.toString()))];
  const users = await User.find(
    { _id: { $in: ids } },
    { name: 1, role: 1, username: 1, avatar_url: 1 },
  ).lean();
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  return docs.map((d) => {
    const u = byId.get(d.author_id.toString());
    return {
      ...d,
      author: u
        ? {
            id: u._id.toString(),
            name: u.name,
            role: u.role,
            username: u.username || null,
            avatarUrl: u.avatar_url || null,
          }
        : null,
    };
  });
}

async function readMyVote(userId, articleId) {
  const v = await Vote.findOne(
    { user_id: new mongoose.Types.ObjectId(userId), article_id: articleId },
    { value: 1 },
  ).lean();
  return v ? v.value : 0;
}

/**
 * Fetch one of the caller's own articles by id, regardless of status. Used by
 * the editor to load any draft (the public `getBySlug` would 404 on non-published).
 */
export async function getMineById(authorId, articleId, actor) {
  const article = await Article.findOne({ _id: articleId, deleted_at: null }).lean();
  if (!article) throw new NotFoundError('Article not found');
  const isOwner = article.author_id.toString() === authorId;
  const isAdmin = actor?.role === 'admin';
  if (!isOwner && !isAdmin) throw new ForbiddenError();
  return article;
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

/**
 * Writer analytics overview. Reads come straight from the denormalized
 * stats_snapshot on each article, so this is a single cheap query.
 */
export async function getWriterStats(authorId) {
  const uid = new mongoose.Types.ObjectId(authorId);
  const [docs, user] = await Promise.all([
    Article.find(
      { author_id: uid, deleted_at: null },
      { title: 1, slug: 1, status: 1, stats_snapshot: 1, published_at: 1, estimated_read_minutes: 1 },
    ).lean(),
    User.findById(uid, { followers_count: 1 }).lean(),
  ]);

  const published = docs.filter((d) => d.status === 'published');
  const totals = { articles: published.length, reads: 0, upvotes: 0, downvotes: 0, comments: 0 };
  const articles = published
    .map((d) => {
      const s = d.stats_snapshot || {};
      totals.reads += s.reads || 0;
      totals.upvotes += s.upvotes || 0;
      totals.downvotes += s.downvotes || 0;
      totals.comments += s.comments_count || 0;
      return {
        id: d._id.toString(),
        title: d.title,
        slug: d.slug,
        publishedAt: d.published_at,
        readMinutes: d.estimated_read_minutes || 1,
        reads: s.reads || 0,
        upvotes: s.upvotes || 0,
        downvotes: s.downvotes || 0,
        comments: s.comments_count || 0,
      };
    })
    .sort((a, b) => b.reads - a.reads);

  return {
    totals: { ...totals, followers: user?.followers_count || 0, drafts: docs.length - published.length },
    articles,
  };
}

function assertCanEdit(article, actor) {
  if (!actor?.id) throw new ForbiddenError();
  if (actor.role === 'admin') return;
  if (article.author_id.toString() !== actor.id) {
    throw new ForbiddenError('Only the author can modify this article');
  }
}
