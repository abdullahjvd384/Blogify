import { Queue } from 'bullmq';
import { bullConnection } from './connection.js';

export const MODERATION_QUEUE = 'moderation';

let queue;

export function moderationQueue() {
  if (!queue) {
    queue = new Queue(MODERATION_QUEUE, {
      connection: bullConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { age: 60 * 60, count: 1000 },
        removeOnFail: { age: 24 * 60 * 60 },
      },
    });
  }
  return queue;
}

/** Enqueues a moderation job for a submitted article. */
export async function enqueueModeration(articleId) {
  const job = await moderationQueue().add('moderate', {
    articleId: articleId.toString(),
  });
  return job;
}
