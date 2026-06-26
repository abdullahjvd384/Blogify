import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/** Host (no scheme) derived from the public origin, e.g. "devcrunch.tech". */
function siteHost() {
  try {
    return new URL(env.CLIENT_ORIGIN || 'https://devcrunch.tech').host;
  } catch {
    return 'devcrunch.tech';
  }
}

export function isIndexNowConfigured() {
  return Boolean(env.INDEXNOW_KEY);
}

/**
 * Notify IndexNow that URLs changed/were published. Submitting once fans out to
 * all participating engines (Bing, Yandex, Naver, Seznam, Yep). Google does NOT
 * use IndexNow — it indexes via the news sitemap + crawl + internal links.
 *
 * Best-effort and non-throwing: indexing must never break publishing.
 * Returns { ok, status } | { skipped }.
 */
export async function pingIndexNow(urls = []) {
  const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (!env.INDEXNOW_KEY) return { skipped: true, reason: 'no_key' };
  if (!list.length) return { skipped: true, reason: 'no_urls' };

  const host = siteHost();
  const body = {
    host,
    key: env.INDEXNOW_KEY,
    keyLocation: `https://${host}/${env.INDEXNOW_KEY}.txt`,
    urlList: list,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      logger.warn({ status: res.status, count: list.length }, 'indexnow: non-OK response');
      return { ok: false, status: res.status };
    }
    logger.info({ status: res.status, count: list.length }, 'indexnow: submitted');
    return { ok: true, status: res.status };
  } catch (err) {
    logger.warn({ err: err.message }, 'indexnow: ping failed');
    return { ok: false, error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}
