import { redis } from '../config/redis.js';
import { PLANS } from '@blogplatform/shared';

const COUNT_KEY = (userId, dateKey) => `quota:reads:count:${userId}:${dateKey}`;
const SET_KEY = (userId, dateKey) => `quota:reads:set:${userId}:${dateKey}`;

/**
 * Returns the YYYY-MM-DD date in the given IANA timezone. We bucket quotas by
 * the user's local day so a Karachi user's "Tuesday" quota matches their wall
 * clock, not UTC.
 */
function dateKeyInTz(timezone, now = new Date()) {
  // en-CA on `Intl.DateTimeFormat` formats as YYYY-MM-DD — handy as a key.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Seconds remaining until midnight in the user's timezone. Used as the TTL
 * for the daily counter so it auto-rolls without a cron job.
 */
function secondsUntilMidnight(timezone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now);

  let h = 0;
  let m = 0;
  let s = 0;
  for (const p of parts) {
    if (p.type === 'hour') h = parseInt(p.value, 10) % 24;
    else if (p.type === 'minute') m = parseInt(p.value, 10);
    else if (p.type === 'second') s = parseInt(p.value, 10);
  }
  const elapsed = h * 3600 + m * 60 + s;
  return Math.max(60, 86400 - elapsed);
}

/**
 * Returns the next "midnight in tz" as an ISO instant. The frontend uses this
 * to render a countdown without needing the user's tz logic on the client.
 */
function nextResetAt(timezone, now = new Date()) {
  const seconds = secondsUntilMidnight(timezone, now);
  return new Date(now.getTime() + seconds * 1000).toISOString();
}

function planLimit(planKey) {
  const plan = PLANS[planKey] || PLANS.free;
  return plan.dailyLimit; // null = unlimited
}

/**
 * Read-only snapshot of today's quota for the user.
 * `null` limit means the plan is unlimited.
 */
export async function getUsage(userId, planKey, timezone) {
  const dateKey = dateKeyInTz(timezone);
  const used = parseInt((await redis.get(COUNT_KEY(userId, dateKey))) || '0', 10);
  const limit = planLimit(planKey);
  return {
    plan: planKey,
    used,
    limit, // null when unlimited
    remaining: limit === null ? null : Math.max(0, limit - used),
    resetAt: nextResetAt(timezone),
  };
}

/**
 * Counts a unique-per-day article read against the user's quota.
 *
 * - Re-reading the same article on the same day is free (idempotent).
 * - Unlimited plans short-circuit and just return current usage.
 * - On exceed: throws nothing here — returns `allowed: false` so the caller
 *   can map to a 402 with the full quota payload.
 *
 * Counter and set both expire at end-of-day-in-tz, so they roll over without
 * a cron job. We always re-set the TTL on writes to absorb clock skew.
 */
export async function consumeRead(userId, articleId, planKey, timezone) {
  const limit = planLimit(planKey);
  const dateKey = dateKeyInTz(timezone);
  const ttl = secondsUntilMidnight(timezone);
  const countKey = COUNT_KEY(userId, dateKey);
  const setKey = SET_KEY(userId, dateKey);

  // Already counted this article today → don't double-charge.
  if (await redis.sismember(setKey, articleId)) {
    return await getUsage(userId, planKey, timezone);
  }

  if (limit === null) {
    await redis.sadd(setKey, articleId);
    await redis.expire(setKey, ttl);
    return await getUsage(userId, planKey, timezone);
  }

  // Atomic INCR; if we exceed the limit we roll it back so the user isn't
  // charged for a denied read.
  const used = await redis.incr(countKey);
  if (used === 1) await redis.expire(countKey, ttl);

  if (used > limit) {
    await redis.decr(countKey);
    return {
      allowed: false,
      plan: planKey,
      used: limit,
      limit,
      remaining: 0,
      resetAt: nextResetAt(timezone),
    };
  }

  await redis.sadd(setKey, articleId);
  await redis.expire(setKey, ttl);

  return {
    allowed: true,
    plan: planKey,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: nextResetAt(timezone),
  };
}
