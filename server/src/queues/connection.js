import IORedis from 'ioredis';
import { env } from '../config/env.js';

/**
 * BullMQ requires its own Redis connection with maxRetriesPerRequest: null and
 * enableReadyCheck disabled. Keep a single shared one per process to avoid
 * exhausting the connection pool when multiple queues coexist.
 */
let connection;

export function bullConnection() {
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return connection;
}
