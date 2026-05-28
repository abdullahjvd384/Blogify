import mongoose from 'mongoose';
import { Vote } from '../../models/Vote.js';
import { Article } from '../../models/Article.js';
import { notify } from '../notifications/notifications.service.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

/**
 * Cast or change a vote.
 *
 * value = 1 → upvote, -1 → downvote.
 * Returns the article's new vote totals plus the caller's current vote.
 *
 * The transition cases are:
 *   no prior vote     → insert, increment one counter
 *   same direction    → no-op (idempotent — caller may have double-clicked)
 *   opposite direction→ flip, +1 on new side, -1 on old side
 *
 * We keep stats_snapshot in sync so the feed/article page can show totals
 * without a $count aggregation.
 */
export async function castVote(userId, articleId, value) {
  const article = await Article.findOne({ _id: articleId, deleted_at: null });
  if (!article) throw new NotFoundError('Article not found');
  if (article.status !== 'published') {
    throw new ConflictError('Cannot vote on an unpublished article');
  }

  const userObjId = new mongoose.Types.ObjectId(userId);
  const existing = await Vote.findOne({ user_id: userObjId, article_id: article._id });

  if (existing && existing.value === value) {
    return { totals: snapshotTotals(article), myVote: existing.value };
  }

  const inc = { 'stats_snapshot.upvotes': 0, 'stats_snapshot.downvotes': 0 };
  if (existing) {
    if (existing.value === 1) inc['stats_snapshot.upvotes'] -= 1;
    else inc['stats_snapshot.downvotes'] -= 1;
    existing.value = value;
    await existing.save();
  } else {
    await Vote.create({ user_id: userObjId, article_id: article._id, value });
  }
  if (value === 1) inc['stats_snapshot.upvotes'] += 1;
  else inc['stats_snapshot.downvotes'] += 1;

  const updated = await Article.findByIdAndUpdate(
    article._id,
    { $inc: inc },
    { new: true, projection: { stats_snapshot: 1 } },
  ).lean();

  // Notify the author when their article gains an upvote (not on downvotes).
  if (value === 1) {
    await notify({
      recipientId: article.author_id,
      actorId: userId,
      type: 'upvote',
      articleId: article._id,
    });
  }

  return { totals: snapshotTotals(updated), myVote: value };
}

export async function clearVote(userId, articleId) {
  const article = await Article.findOne({ _id: articleId, deleted_at: null });
  if (!article) throw new NotFoundError('Article not found');

  const userObjId = new mongoose.Types.ObjectId(userId);
  const existing = await Vote.findOneAndDelete({ user_id: userObjId, article_id: article._id });
  if (!existing) {
    return { totals: snapshotTotals(article), myVote: 0 };
  }

  const field = existing.value === 1 ? 'stats_snapshot.upvotes' : 'stats_snapshot.downvotes';
  const updated = await Article.findByIdAndUpdate(
    article._id,
    { $inc: { [field]: -1 } },
    { new: true, projection: { stats_snapshot: 1 } },
  ).lean();

  return { totals: snapshotTotals(updated), myVote: 0 };
}

export async function getMyVote(userId, articleId) {
  const vote = await Vote.findOne({
    user_id: new mongoose.Types.ObjectId(userId),
    article_id: new mongoose.Types.ObjectId(articleId),
  }).lean();
  return vote ? vote.value : 0;
}

function snapshotTotals(doc) {
  const s = doc?.stats_snapshot || {};
  return {
    upvotes: s.upvotes || 0,
    downvotes: s.downvotes || 0,
  };
}
