/**
 * Subscription plans. Money is stored as integer paisa (1 PKR = 100 paisa).
 * `dailyLimit: null` means unlimited.
 *
 * Source of truth — server enforces, client mirrors for UX hints.
 */
export const PLANS = Object.freeze({
  free: { key: 'free', label: 'Free', dailyLimit: 3, pricePaisa: 0 },
  basic: { key: 'basic', label: 'Basic', dailyLimit: 10, pricePaisa: 50_000 },
  pro: { key: 'pro', label: 'Pro', dailyLimit: 25, pricePaisa: 100_000 },
  god_tier: { key: 'god_tier', label: 'God Tier', dailyLimit: null, pricePaisa: 250_000 },
});

export const PLAN_KEYS = Object.freeze(Object.keys(PLANS));

export const DEFAULT_PLAN = 'free';

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
