import { Worker } from 'bullmq';
import { bullConnection } from '../src/queues/connection.js';
import { CONTENT_QUEUE } from '../src/queues/content.js';
import { logger } from '../src/config/logger.js';
import { generateOneArticle } from '../src/services/contentGenerator.js';

/**
 * Runs the auto-content pipeline `count` times. Each generation is wrapped so one
 * failure doesn't fail the whole job (which would trigger a retry and risk a
 * duplicate post) — a failed slot is simply skipped until the next cron run.
 */
async function processContentJob(job) {
  const count = Math.max(1, Math.min(5, Number(job.data?.count) || 1));
  const results = [];
  for (let i = 0; i < count; i++) {
    try {
      results.push(await generateOneArticle());
    } catch (err) {
      logger.error({ err: err.message }, 'auto-content: generation error');
      results.push({ error: err.message });
    }
  }
  return results;
}

export function startContentWorker() {
  const worker = new Worker(CONTENT_QUEUE, processContentJob, {
    connection: bullConnection(),
    concurrency: 1,
  });
  worker.on('completed', (job, result) =>
    logger.info({ jobId: job.id, result }, 'auto-content job completed'),
  );
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err: err?.message }, 'auto-content job failed'),
  );
  // Connection/BullMQ errors (e.g. Redis over quota) must be handled or Node
  // turns the unhandled 'error' event into an uncaughtException that kills the
  // process. Log and let BullMQ reconnect on its own.
  worker.on('error', (err) =>
    logger.error({ err: err?.message }, 'auto-content worker error (redis/bullmq)'),
  );
  return worker;
}
