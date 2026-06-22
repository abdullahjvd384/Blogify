import { Queue } from 'bullmq';
import { bullConnection } from './connection.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const CONTENT_QUEUE = 'content';

let queue;

export function contentQueue() {
  if (!queue) {
    queue = new Queue(CONTENT_QUEUE, {
      connection: bullConnection(),
      defaultJobOptions: {
        // Don't retry generation jobs aggressively — a failed run just means we
        // skip this slot (the next cron run tries again); avoids duplicate posts.
        attempts: 1,
        removeOnComplete: { age: 7 * 24 * 60 * 60, count: 200 },
        removeOnFail: { age: 14 * 24 * 60 * 60 },
      },
    });
  }
  return queue;
}

/** Register the repeatable cron schedule (idempotent across restarts). */
export async function scheduleContentJobs() {
  await contentQueue().upsertJobScheduler(
    'auto-content',
    { pattern: env.AUTO_CONTENT_CRON, tz: env.AUTO_CONTENT_TZ },
    { name: 'generate', data: { count: env.AUTO_CONTENT_PER_RUN, scheduled: true } },
  );
  logger.info(
    { cron: env.AUTO_CONTENT_CRON, tz: env.AUTO_CONTENT_TZ, perRun: env.AUTO_CONTENT_PER_RUN },
    'auto-content schedule registered',
  );
}

/** Enqueue an immediate generation run (manual admin trigger / testing). */
export async function enqueueContentNow(count = 1) {
  return contentQueue().add('generate', { count, scheduled: false });
}
