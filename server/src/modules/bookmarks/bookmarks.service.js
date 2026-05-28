import mongoose from 'mongoose';
import { Bookmark } from '../../models/Bookmark.js';
import { Article } from '../../models/Article.js';
import { attachAuthors } from '../articles/articles.service.js';
import { NotFoundError } from '../../utils/errors.js';

function toObjId(id) {
  return new mongoose.Types.ObjectId(id);
}

/** Save an article. Idempotent — saving twice is a no-op. */
export async function save(userId, articleId) {
  const article = await Article.findOne(
    { _id: articleId, deleted_at: null, status: 'published' },
    { _id: 1 },
  ).lean();
  if (!article) throw new NotFoundError('Article not found');

  try {
    await Bookmark.create({ user_id: toObjId(userId), article_id: toObjId(articleId) });
  } catch (err) {
    if (err?.code !== 11000) throw err; // already saved → idempotent
  }
  return { bookmarked: true };
}

/** Remove a save. Idempotent. */
export async function remove(userId, articleId) {
  await Bookmark.deleteOne({ user_id: toObjId(userId), article_id: toObjId(articleId) });
  return { bookmarked: false };
}

/** Whether the user has saved this article. */
export async function isSaved(userId, articleId) {
  const exists = await Bookmark.exists({ user_id: toObjId(userId), article_id: toObjId(articleId) });
  return { bookmarked: Boolean(exists) };
}

/**
 * The user's saved articles, newest-saved first, cursor-paged. Articles that
 * were since unpublished or deleted are filtered out (they just don't appear).
 */
export async function list(userId, { cursor, limit }) {
  const q = { user_id: toObjId(userId) };
  if (cursor) q._id = { $lt: toObjId(cursor) };

  const marks = await Bookmark.find(q).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = marks.length > limit;
  const page = hasMore ? marks.slice(0, limit) : marks;

  const articleIds = page.map((m) => m.article_id);
  const articles = await Article.find({
    _id: { $in: articleIds },
    deleted_at: null,
    status: 'published',
  }).lean();
  const byId = new Map(articles.map((a) => [a._id.toString(), a]));

  // Preserve save order; drop any that are no longer visible.
  const ordered = page.map((m) => byId.get(m.article_id.toString())).filter(Boolean);
  const enriched = await attachAuthors(ordered);

  return {
    items: enriched,
    cursor: page.length ? page[page.length - 1]._id.toString() : null,
    hasMore,
  };
}
