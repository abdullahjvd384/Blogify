/**
 * App currency. Money is billed and paid out in US Dollars.
 * NOTE: amounts are stored as integer minor units (USD cents). The historical
 * field names still say "Paisa" — read them as "cents" (1 USD = 100 cents).
 */
export const CURRENCY = Object.freeze({ code: 'USD', symbol: '$', minorPerUnit: 100 });

/**
 * Subscription plans. Money is stored as integer USD cents (1 USD = 100 cents).
 *
 * Medium-style model: `free` reads everything that isn't member-only (plus a
 * monthly meter of free member-only stories); `member` unlocks all member-only
 * content. Source of truth — server enforces, client mirrors for UX hints.
 */
export const PLANS = Object.freeze({
  free: { key: 'free', label: 'Free', pricePaisaMonthly: 0, pricePaisaAnnual: 0 },
  // $5 / month, $50 / year (cents).
  member: { key: 'member', label: 'Member', pricePaisaMonthly: 500, pricePaisaAnnual: 5_000 },
});

export const PLAN_KEYS = Object.freeze(Object.keys(PLANS));

export const DEFAULT_PLAN = 'free';

export const BILLING_CYCLES = Object.freeze(['monthly', 'annual']);

/**
 * Membership + writer-payout economics. All money in USD cents.
 * - FREE_METER_PER_MONTH: member-only stories a non-member may read per month.
 * - PAYOUT_PERCENT: share of monthly membership revenue paid out to writers
 *   (the platform keeps the rest to run the service).
 * - MIN_WITHDRAWAL_PAISA: minimum a writer can cash out (cents) — $10.
 * - PLATFORM_TZ: timezone defining monthly payout periods + the meter month.
 */
export const MEMBERSHIP = Object.freeze({
  FREE_METER_PER_MONTH: 3,
  PAYOUT_PERCENT: 40,
  MIN_WITHDRAWAL_PAISA: 1_000,
  PLATFORM_TZ: 'Asia/Karachi',
});

/** Cookie names used across server + client. */
export const COOKIE_NAMES = Object.freeze({
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
});

export const TOKEN_TTL = Object.freeze({
  ACCESS_SECONDS: 15 * 60,
  REFRESH_SECONDS: 30 * 24 * 60 * 60,
});

export const API_PREFIX = '/api/v1';

/** Username/handle rules (used for profile URLs like /u/:username). */
export const USERNAME_RULES = Object.freeze({
  MIN: 3,
  MAX: 30,
  PATTERN: '^[a-z0-9_-]+$',
});

/** Comment/response limits. MAX_DEPTH 1 = one level of nesting (Medium-style responses). */
export const COMMENT_LIMITS = Object.freeze({
  MAX_BODY: 2000,
  MAX_DEPTH: 1,
});

/** Profile bio limit. */
export const PROFILE_LIMITS = Object.freeze({
  BIO_MAX: 280,
});
