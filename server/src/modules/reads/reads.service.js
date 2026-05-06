import { Article } from '../../models/Article.js';
import { Read } from '../../models/Read.js';
import {
  startSession,
  applyHeartbeat,
  endSession,
  WATCH_TIME_INFLATION_MULTIPLIER,
  ABSOLUTE_WATCH_CAP_SECONDS,
} from '../../services/readSession.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/** Articles below this cumulative dwell time aren't counted as a read in stats. */
const COMPLETION_FRACTION = 0.5; // 50% of estimated time = "completed"
const MIN_MEANINGFUL_SECONDS = 10;

/**
 * Resolve the per-article hard cap on watch time. Used by the heartbeat path
 * so a script can't pile up a fake 6-hour read.
 */
function watchCapForArticle(article) {
  const expected = Math.max(60, (article.estimated_read_minutes || 1) * 60);
  return Math.min(ABSOLUTE_WATCH_CAP_SECONDS, expected * WATCH_TIME_INFLATION_MULTIPLIER);
}

async function loadPublishedArticle(articleId) {
  const article = await Article.findOne({ _id: articleId, deleted_at: null }).lean();
  if (!article) throw new NotFoundError('Article not found');
  if (article.status !== 'published') {
    throw new ConflictError('Cannot track reads for an unpublished article');
  }
  return article;
}

export async function start(userId, articleId) {
  await loadPublishedArticle(articleId);
  const session = await startSession(userId, articleId);
  return {
    startedAt: session.started_at,
    watchedSeconds: session.watched_seconds,
  };
}

export async function heartbeat(userId, articleId) {
  const article = await loadPublishedArticle(articleId);
  const cap = watchCapForArticle(article);
  const session = await applyHeartbeat(userId, articleId, { cap });
  return {
    watchedSeconds: session.watched_seconds,
    fraudScore: session.fraud_score,
    cappedAt: cap,
  };
}

/**
 * Finalize the session: persist a Read row, bump article stats once per
 * meaningful read, return the result. Idempotent — calling end twice in a
 * row produces the second call as a no-op (no session in Redis → return null).
 */
export async function end(userId, articleId, ctx = {}) {
  const article = await loadPublishedArticle(articleId);
  const cap = watchCapForArticle(article);
  const session = await endSession(userId, articleId, { cap });
  if (!session) return null;

  const watchedSeconds = Math.min(session.watched_seconds, cap);
  const expected = Math.max(60, (article.estimated_read_minutes || 1) * 60);
  const completed = watchedSeconds >= expected * COMPLETION_FRACTION;
  const meaningful = watchedSeconds >= MIN_MEANINGFUL_SECONDS;

  const read = await Read.create({
    user_id: userId,
    article_id: article._id,
    started_at: new Date(session.started_at),
    ended_at: new Date(),
    watched_seconds: watchedSeconds,
    completed,
    fraud_score: session.fraud_score,
    ip: ctx.ip || null,
    user_agent: ctx.userAgent || null,
  });

  // Bump the article's stats snapshot atomically. We only count a session as a
  // "read" if the user lingered past MIN_MEANINGFUL_SECONDS — bouncers don't
  // pad the writer's analytics.
  if (meaningful) {
    try {
      await Article.updateOne(
        { _id: article._id },
        { $inc: { 'stats_snapshot.reads': 1 } },
      );
    } catch (err) {
      logger.error({ err, articleId }, 'failed to bump article stats on read end');
    }
  }

  return {
    id: read._id.toString(),
    watchedSeconds,
    completed,
    counted: meaningful,
    fraudScore: session.fraud_score,
  };
}
