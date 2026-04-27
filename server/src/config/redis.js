import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Single shared Redis client for the app process.
 * BullMQ workers create their own connections via this URL.
 */
export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('connect', () => logger.info('redis connecting'));
redis.on('ready', () => logger.info('redis ready'));
redis.on('error', (err) => logger.error({ err }, 'redis error'));
redis.on('end', () => logger.warn('redis connection closed'));

export async function disconnectRedis() {
  await redis.quit();
}
