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

/**
 * Shared Worker tuning for a low-volume app on a metered Redis (Upstash free
 * tier = 500k requests/month). Idle workers poll Redis on two timers, and the
 * BullMQ defaults (drainDelay 5s, stalledInterval 30s) burn ~600k+/month *per
 * worker* doing nothing. A newly added job still wakes the worker instantly via
 * BullMQ's marker, and delayed jobs are promoted on schedule regardless — so
 * widening these only cuts idle re-polling, not job latency.
 *   - drainDelay 60s  (default 5s)  → ~12x fewer idle blocking fetches
 *   - stalledInterval 5m (default 30s) → ~10x fewer stalled-job scans
 */
export const WORKER_TUNING = {
  drainDelay: 60,
  stalledInterval: 300_000,
};
