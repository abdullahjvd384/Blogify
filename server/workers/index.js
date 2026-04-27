import { logger } from '../src/config/logger.js';
import { redis } from '../src/config/redis.js';

/**
 * BullMQ worker entrypoint. Day 1 placeholder: just keeps the process alive
 * and logs Redis connectivity. Real workers (moderation, email, analytics)
 * land Day 4 and Day 8.
 */
async function main() {
  await redis.ping();
  logger.info('worker process started — no queues registered yet');

  const shutdown = async () => {
    logger.info('worker shutting down');
    await redis.quit().catch(() => {});
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'worker fatal');
  process.exit(1);
});
