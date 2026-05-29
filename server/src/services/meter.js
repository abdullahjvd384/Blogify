import { redis } from '../config/redis.js';
import { MEMBERSHIP } from '@blogplatform/shared';

const LIMIT = MEMBERSHIP.FREE_METER_PER_MONTH;
const TTL_SECONDS = 40 * 24 * 60 * 60; // > any month; the month-keyed name handles rollover

const COUNT_KEY = (userId, monthKey) => `meter:memberstory:count:${userId}:${monthKey}`;
const SET_KEY = (userId, monthKey) => `meter:memberstory:set:${userId}:${monthKey}`;

/** YYYY-MM in the given IANA timezone. */
function monthKeyInTz(timezone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  return `${y}-${m}`;
}

/** Approx ISO instant for the first day of next month (for the UI countdown). */
function nextResetAt(timezone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  let y = parseInt(parts.find((p) => p.type === 'year').value, 10);
  let m = parseInt(parts.find((p) => p.type === 'month').value, 10); // 1-12
  m += 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return new Date(Date.UTC(y, m - 1, 1)).toISOString();
}

/** Read-only snapshot of this month's free member-only-story meter. */
export async function getMeterUsage(userId, timezone) {
  const monthKey = monthKeyInTz(timezone);
  const used = parseInt((await redis.get(COUNT_KEY(userId, monthKey))) || '0', 10);
  return {
    used,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - used),
    resetAt: nextResetAt(timezone),
  };
}

/**
 * Counts a unique-per-month member-only story view against the free meter.
 * Idempotent per article per month (re-reading the same one is free).
 * Returns `{ allowed, used, limit, remaining, resetAt }`.
 */
export async function consumeMemberStory(userId, articleId, timezone) {
  const monthKey = monthKeyInTz(timezone);
  const countKey = COUNT_KEY(userId, monthKey);
  const setKey = SET_KEY(userId, monthKey);

  if (await redis.sismember(setKey, articleId)) {
    const used = parseInt((await redis.get(countKey)) || '0', 10);
    return { allowed: true, used, limit: LIMIT, remaining: Math.max(0, LIMIT - used), resetAt: nextResetAt(timezone) };
  }

  const used = await redis.incr(countKey);
  if (used === 1) await redis.expire(countKey, TTL_SECONDS);

  if (used > LIMIT) {
    await redis.decr(countKey);
    return { allowed: false, used: LIMIT, limit: LIMIT, remaining: 0, resetAt: nextResetAt(timezone) };
  }

  await redis.sadd(setKey, articleId);
  await redis.expire(setKey, TTL_SECONDS);
  return { allowed: true, used, limit: LIMIT, remaining: Math.max(0, LIMIT - used), resetAt: nextResetAt(timezone) };
}
