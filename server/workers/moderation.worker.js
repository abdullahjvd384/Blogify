import { Worker } from 'bullmq';
import { Article } from '../src/models/Article.js';
import { ModerationJob } from '../src/models/ModerationJob.js';
import { logger } from '../src/config/logger.js';
import { moderateArticle } from '../src/services/openai.js';
import { bullConnection } from '../src/queues/connection.js';
import { MODERATION_QUEUE } from '../src/queues/moderation.js';

/**
 * Confidence floor for treating a verdict as final. Borderline cases — and
 * everything from a fallback after an OpenAI failure — drop to needs_review so
 * a human can decide.
 */
const CONFIDENCE_FLOOR = 0.6;

const TERMINAL_STATUSES = new Set([
  'published',
  'rejected',
  'unpublished',
  'removed',
]);

/**
 * Runs one moderation job:
 *   1. Load article; abort if it's no longer in `submitted`.
 *   2. Mark in_review and create ModerationJob audit row.
 *   3. Call OpenAI.
 *   4. Apply verdict to Article (publish / reject / needs_review) + persist
 *      audit details.
 *
 * Throws on transient failures so BullMQ retries via the configured backoff.
 * On the final attempt the Worker's `failed` event handler routes the article
 * to `needs_review` so a human can take over.
 */
async function processModerationJob(job) {
  const { articleId } = job.data;
  const article = await Article.findById(articleId);
  if (!article) {
    logger.warn({ articleId }, 'moderation: article missing, skipping');
    return { skipped: true };
  }
  if (article.status !== 'submitted' && article.status !== 'in_review') {
    logger.warn(
      { articleId, status: article.status },
      'moderation: article not in submittable state, skipping',
    );
    return { skipped: true };
  }

  const audit = await ModerationJob.create({
    article_id: article._id,
    status: 'running',
    queue_job_id: job.id,
    attempt: job.attemptsMade + 1,
    started_at: new Date(),
  });

  if (article.status === 'submitted') {
    article.status = 'in_review';
    await article.save();
  }

  const result = await moderateArticle({
    title: article.title,
    // Moderate the readable plaintext, not raw HTML markup. Falls back to the
    // raw content for legacy rows that predate content_text.
    content: article.content_text || article.content,
    tags: article.tags,
  });

  let finalVerdict = result.verdict;
  if (finalVerdict === 'approved' && result.confidence < CONFIDENCE_FLOOR) {
    finalVerdict = 'needs_review';
  }

  await applyVerdict(article, {
    verdict: finalVerdict,
    confidence: result.confidence,
    reasons: result.reasons,
    suggestedTags: result.suggestedTags,
    model: result.model,
  });

  audit.status = 'succeeded';
  audit.verdict = finalVerdict;
  audit.confidence = result.confidence;
  audit.reasons = result.reasons;
  audit.suggested_tags = result.suggestedTags;
  audit.model = result.model;
  audit.raw_response = result.raw;
  audit.finished_at = new Date();
  await audit.save();

  return { verdict: finalVerdict };
}

/** Updates Article status + moderation snapshot based on the verdict. */
async function applyVerdict(article, { verdict, confidence, reasons, suggestedTags, model }) {
  if (TERMINAL_STATUSES.has(article.status)) return;

  const moderation = {
    last_verdict: verdict,
    confidence,
    reasons,
    model,
    decided_at: new Date(),
    decided_by: 'ai',
  };

  if (verdict === 'approved') {
    article.status = 'published';
    if (!article.published_at) article.published_at = new Date();
  } else if (verdict === 'rejected') {
    article.status = 'rejected';
  } else {
    article.status = 'needs_review';
  }

  // Merge suggested tags into existing tags (deduped, capped at 8).
  if (suggestedTags?.length) {
    const merged = Array.from(
      new Set([...(article.tags || []), ...suggestedTags.map((t) => t.toLowerCase())]),
    ).slice(0, 8);
    article.tags = merged;
  }

  article.moderation = moderation;
  await article.save();
}

/**
 * On final failure (all retries exhausted), route the article to needs_review
 * and log the audit row so a human can pick it up. Without this, a transient
 * OpenAI outage would strand articles in `in_review` forever.
 */
async function handleTerminalFailure(jobData, err) {
  try {
    const article = await Article.findById(jobData.articleId);
    if (!article) return;
    if (TERMINAL_STATUSES.has(article.status)) return;

    article.status = 'needs_review';
    article.moderation = {
      last_verdict: 'needs_review',
      confidence: 0,
      reasons: ['moderation_unavailable'],
      model: null,
      decided_at: new Date(),
      decided_by: 'ai',
    };
    await article.save();

    await ModerationJob.create({
      article_id: article._id,
      status: 'failed',
      verdict: 'needs_review',
      reasons: ['moderation_unavailable'],
      error: err?.message?.slice(0, 500) || 'unknown',
      finished_at: new Date(),
    });
  } catch (innerErr) {
    logger.error({ err: innerErr }, 'moderation: failed to record terminal failure');
  }
}

export function startModerationWorker() {
  const worker = new Worker(MODERATION_QUEUE, processModerationJob, {
    connection: bullConnection(),
    concurrency: 2,
  });

  worker.on('completed', (job, result) => {
    logger.info(
      { jobId: job.id, articleId: job.data.articleId, result },
      'moderation completed',
    );
  });

  worker.on('failed', async (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        articleId: job?.data?.articleId,
        attempts: job?.attemptsMade,
        err: { message: err?.message },
      },
      'moderation job failed',
    );
    if (job && job.attemptsMade >= (job.opts?.attempts ?? 1)) {
      await handleTerminalFailure(job.data, err);
    }
  });

  // Connection/BullMQ errors (e.g. Redis over quota) must be handled or Node
  // turns the unhandled 'error' event into an uncaughtException that kills the
  // process. Log and let BullMQ reconnect on its own.
  worker.on('error', (err) =>
    logger.error({ err: err?.message }, 'moderation worker error (redis/bullmq)'),
  );

  return worker;
}
