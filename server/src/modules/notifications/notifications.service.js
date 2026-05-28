import mongoose from 'mongoose';
import { Notification } from '../../models/Notification.js';
import { User } from '../../models/User.js';
import { Article } from '../../models/Article.js';
import { logger } from '../../config/logger.js';

function toObjId(id) {
  return new mongoose.Types.ObjectId(id);
}

/**
 * Best-effort notification creation. Never throws — a failed notification must
 * not break the action that triggered it (follow/comment/vote). Skips self-acts.
 */
export async function notify({ recipientId, actorId, type, articleId = null, commentId = null }) {
  try {
    if (!recipientId || !actorId) return;
    if (recipientId.toString() === actorId.toString()) return; // no self-notifications
    await Notification.create({
      recipient_id: recipientId,
      actor_id: actorId,
      type,
      article_id: articleId,
      comment_id: commentId,
    });
  } catch (err) {
    logger.warn({ err, type }, 'failed to create notification');
  }
}

export async function unreadCount(userId) {
  const count = await Notification.countDocuments({ recipient_id: toObjId(userId), read_at: null });
  return { count };
}

export async function list(userId, { cursor, limit }) {
  const filter = { recipient_id: toObjId(userId) };
  if (cursor) filter._id = { $lt: toObjId(cursor) };

  const docs = await Notification.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;

  const actorIds = [...new Set(page.map((n) => n.actor_id.toString()))];
  const articleIds = [...new Set(page.filter((n) => n.article_id).map((n) => n.article_id.toString()))];
  const [actors, articles] = await Promise.all([
    User.find({ _id: { $in: actorIds } }, { name: 1, username: 1, avatar_url: 1 }).lean(),
    articleIds.length
      ? Article.find({ _id: { $in: articleIds } }, { title: 1, slug: 1 }).lean()
      : [],
  ]);
  const actorById = new Map(actors.map((u) => [u._id.toString(), u]));
  const articleById = new Map(articles.map((a) => [a._id.toString(), a]));

  const items = page.map((n) => {
    const a = actorById.get(n.actor_id.toString());
    const art = n.article_id ? articleById.get(n.article_id.toString()) : null;
    return {
      id: n._id.toString(),
      type: n.type,
      readAt: n.read_at,
      createdAt: n.created_at,
      actor: a
        ? { id: a._id.toString(), name: a.name, username: a.username || null, avatarUrl: a.avatar_url || null }
        : null,
      article: art ? { id: art._id.toString(), title: art.title, slug: art.slug } : null,
    };
  });

  return {
    items,
    cursor: page.length ? page[page.length - 1]._id.toString() : null,
    hasMore,
  };
}

export async function markRead(userId, notificationId) {
  await Notification.updateOne(
    { _id: notificationId, recipient_id: toObjId(userId) },
    { $set: { read_at: new Date() } },
  );
  return { ok: true };
}

export async function markAllRead(userId) {
  await Notification.updateMany(
    { recipient_id: toObjId(userId), read_at: null },
    { $set: { read_at: new Date() } },
  );
  return { ok: true };
}
