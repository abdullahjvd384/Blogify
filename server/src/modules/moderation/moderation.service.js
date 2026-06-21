import mongoose from 'mongoose';
import { Article } from '../../models/Article.js';
import { ModerationJob } from '../../models/ModerationJob.js';
import { User } from '../../models/User.js';
import { enqueueModeration } from '../../queues/moderation.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

const REVIEWABLE_STATUSES = new Set([
  'submitted',
  'in_review',
  'needs_review',
  'rejected',
]);

/**
 * Cursor-paginated queue of articles awaiting (or done with) moderation.
 * Default surface is `needs_review` — the queue admins actually act on. The
 * `rejected` filter exists so admins can audit / undo recent rejections.
 *
 * Returns each article enriched with author summary and the most recent
 * ModerationJob audit row (so the UI can render reasons and confidence).
 */
export async function listQueue({ cursor, limit, status }) {
  const filter = { status, deleted_at: null };
  if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };

  const docs = await Article.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;

  const [users, jobs] = await Promise.all([
    fetchAuthors(items),
    fetchLatestJobs(items),
  ]);

  const enriched = items.map((a) => ({
    ...a,
    author: users.get(a.author_id.toString()) || null,
    latest_job: jobs.get(a._id.toString()) || null,
  }));

  return {
    items: enriched,
    cursor: enriched.length ? enriched[enriched.length - 1]._id.toString() : null,
    hasMore,
  };
}

/**
 * Admin override → publish. Bypasses OpenAI; records an audit row with
 * decided_by: 'admin' so we keep a paper trail even on manual decisions.
 */
export async function adminApprove(articleId, admin) {
  const article = await loadReviewable(articleId);
  article.status = 'published';
  if (!article.published_at) article.published_at = new Date();
  article.moderation = {
    last_verdict: 'approved',
    confidence: 1,
    reasons: [],
    model: 'admin-override',
    decided_at: new Date(),
    decided_by: 'admin',
  };
  await article.save();

  await ModerationJob.create({
    article_id: article._id,
    status: 'succeeded',
    verdict: 'approved',
    confidence: 1,
    reasons: [],
    decided_by: 'admin',
    model: 'admin-override',
    raw_response: { admin_id: admin.id },
    finished_at: new Date(),
  });

  return article.toObject();
}

/** Admin override → reject with explicit reasons. */
export async function adminReject(articleId, admin, { reasons }) {
  const article = await loadReviewable(articleId);
  article.status = 'rejected';
  article.moderation = {
    last_verdict: 'rejected',
    confidence: 1,
    reasons,
    model: 'admin-override',
    decided_at: new Date(),
    decided_by: 'admin',
  };
  await article.save();

  await ModerationJob.create({
    article_id: article._id,
    status: 'succeeded',
    verdict: 'rejected',
    confidence: 1,
    reasons,
    decided_by: 'admin',
    model: 'admin-override',
    raw_response: { admin_id: admin.id },
    finished_at: new Date(),
  });

  return article.toObject();
}

/**
 * Admin retry: send the article back through OpenAI. Useful when the model was
 * having a bad day, or when prompts/rules changed and we want to re-grade an
 * article. Resets status to `submitted` so the worker picks it up.
 */
export async function adminRetry(articleId) {
  const article = await loadReviewable(articleId);
  if (article.status === 'published') {
    throw new ConflictError('Cannot retry a published article — unpublish first');
  }
  article.status = 'submitted';
  await article.save();
  await enqueueModeration(article._id);
  return article.toObject();
}

async function loadReviewable(articleId) {
  const article = await Article.findById(articleId);
  if (!article || article.deleted_at) throw new NotFoundError('Article not found');
  if (!REVIEWABLE_STATUSES.has(article.status) && article.status !== 'published') {
    throw new ConflictError(`Article is in status ${article.status}; cannot moderate`);
  }
  return article;
}

async function fetchAuthors(items) {
  if (!items.length) return new Map();
  const ids = [...new Set(items.map((d) => d.author_id.toString()))];
  const users = await User.find({ _id: { $in: ids } }, { name: 1, role: 1, email: 1 }).lean();
  return new Map(
    users.map((u) => [u._id.toString(), { id: u._id.toString(), name: u.name, email: u.email, role: u.role }]),
  );
}

async function fetchLatestJobs(items) {
  if (!items.length) return new Map();
  const ids = items.map((d) => d._id);
  const jobs = await ModerationJob.aggregate([
    { $match: { article_id: { $in: ids } } },
    { $sort: { created_at: -1 } },
    {
      $group: {
        _id: '$article_id',
        latest: { $first: '$$ROOT' },
      },
    },
  ]);
  return new Map(jobs.map((j) => [j._id.toString(), j.latest]));
}
