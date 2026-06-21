import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);

import { connectDb, disconnectDb } from '../src/config/db.js';
import { logger } from '../src/config/logger.js';
import { redis } from '../src/config/redis.js';
import { startModerationWorker } from './moderation.worker.js';

/**
 * BullMQ worker entrypoint. Connects Mongo (for model writes) and starts every
 * registered queue worker. Workers run in their own process so a slow OpenAI
 * call can't block the API event loop.
 */
async function main() {
  await connectDb();
  await redis.ping();

  const moderationWorker = startModerationWorker();
  logger.info('moderation worker started');

  const shutdown = async () => {
    logger.info('worker shutting down');
    await moderationWorker.close().catch(() => {});
    await redis.quit().catch(() => {});
    await disconnectDb().catch(() => {});
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'worker fatal');
  process.exit(1);
});
