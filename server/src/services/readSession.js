import { redis } from '../config/redis.js';

/**
 * Per-(user, article) read session held in Redis.
 *
 * Why Redis and not Mongo: heartbeats are frequent and small, so we don't want
 * to hammer the primary every 15 seconds. The session is finalized into Mongo
 * exactly once on /reads/end (or when the TTL evicts a stale tab — Phase 2
 * sweeper).
 *
 * Watched seconds is computed server-side from capped deltas, never trusted
 * from the client. A delta larger than MAX_DELTA_SECONDS is clamped and
 * increments fraud_score so we can audit suspicious sessions later.
 */

const SESSION_KEY = (userId, articleId) => `read:session:${userId}:${articleId}`;
const SESSION_TTL_SECONDS = 60 * 60; // 1h: the longest plausible read; reset on each beat

/** Hard cap on how many seconds a single heartbeat can add to watch time. */
export const MAX_DELTA_SECONDS = 60;

/** Total watch time is capped at 6× expected read time to defang inflation attacks. */
export const WATCH_TIME_INFLATION_MULTIPLIER = 6;
/** Articles without an estimate (shouldn't happen) get this absolute fallback cap. */
export const ABSOLUTE_WATCH_CAP_SECONDS = 60 * 60;

export async function startSession(userId, articleId, now = new Date()) {
  const key = SESSION_KEY(userId, articleId);
  const payload = {
    started_at: now.toISOString(),
    last_heartbeat_at: now.toISOString(),
    watched_seconds: 0,
    fraud_score: 0,
  };
  await redis.set(key, JSON.stringify(payload), 'EX', SESSION_TTL_SECONDS);
  return payload;
}

/**
 * Apply one heartbeat. Adds the time elapsed since the last heartbeat (capped)
 * and refreshes the TTL. Returns the updated state.
 *
 * If no session exists (e.g. server restarted, TTL expired), we lazily create
 * one — but flag fraud_score so a writer-facing report can spot it.
 */
export async function applyHeartbeat(userId, articleId, opts = {}, now = new Date()) {
  const key = SESSION_KEY(userId, articleId);
  const raw = await redis.get(key);

  if (!raw) {
    const seeded = await startSession(userId, articleId, now);
    seeded.fraud_score = 1;
    await redis.set(key, JSON.stringify(seeded), 'EX', SESSION_TTL_SECONDS);
    return { ...seeded, missingStart: true };
  }

  const session = JSON.parse(raw);
  const lastBeat = Date.parse(session.last_heartbeat_at);
  const rawDelta = Math.max(0, Math.floor((now.getTime() - lastBeat) / 1000));
  const delta = Math.min(rawDelta, MAX_DELTA_SECONDS);

  session.watched_seconds += delta;
  session.last_heartbeat_at = now.toISOString();
  if (rawDelta > MAX_DELTA_SECONDS) session.fraud_score += 1;
  if (opts.cap && session.watched_seconds > opts.cap) {
    session.watched_seconds = opts.cap;
    session.fraud_score += 1;
  }

  await redis.set(key, JSON.stringify(session), 'EX', SESSION_TTL_SECONDS);
  return session;
}

/**
 * Finalize the session and return the final state. Applies one last capped
 * delta from `last_heartbeat_at → now` so a tab that closes between scheduled
 * heartbeats still records the time the reader was actually on the page.
 */
export async function endSession(userId, articleId, opts = {}, now = new Date()) {
  const key = SESSION_KEY(userId, articleId);
  const raw = await redis.get(key);
  if (!raw) return null;

  const session = JSON.parse(raw);
  const lastBeat = Date.parse(session.last_heartbeat_at);
  const rawDelta = Math.max(0, Math.floor((now.getTime() - lastBeat) / 1000));
  const delta = Math.min(rawDelta, MAX_DELTA_SECONDS);

  session.watched_seconds += delta;
  if (rawDelta > MAX_DELTA_SECONDS) session.fraud_score += 1;
  if (opts.cap && session.watched_seconds > opts.cap) {
    session.watched_seconds = opts.cap;
    session.fraud_score += 1;
  }

  await redis.del(key);
  return session;
}

export async function peekSession(userId, articleId) {
  const key = SESSION_KEY(userId, articleId);
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
}
