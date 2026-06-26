import crypto from 'node:crypto';
import { API_PREFIX } from '@blogplatform/shared';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Article } from '../models/Article.js';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { dailyDigestTemplate, sendBatchEmails } from './email.js';

const SITE = (env.CLIENT_ORIGIN || 'https://devcrunch.tech').replace(/\/$/, '');
// DevCrunch's own articles set their moderation.model to 'auto*' (auto-content)
// or 'editorial' (seeded). User submissions carry the bare moderation model
// name, so this cleanly excludes them from the newsletter.
const OWN_ARTICLE_MODEL = /^(auto|editorial)/;

/** Stateless, per-email unsubscribe token (HMAC) — no DB column or migration. */
export function unsubscribeToken(email) {
  return crypto
    .createHmac('sha256', env.JWT_ACCESS_SECRET)
    .update(String(email).toLowerCase())
    .digest('hex')
    .slice(0, 32);
}

export function unsubscribeUrl(email) {
  const e = encodeURIComponent(String(email).toLowerCase());
  return `${SITE}${API_PREFIX}/newsletter/unsubscribe?e=${e}&t=${unsubscribeToken(email)}`;
}

/** Constant-time check that a token matches the email. */
export function verifyUnsubscribe(email, token) {
  if (!email || !token) return false;
  const expected = unsubscribeToken(email);
  const a = Buffer.from(String(token));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Sends the once-daily digest: bundles DevCrunch's own articles published in the
 * last 24h and emails every active subscriber a single, personalized email with
 * a one-click unsubscribe link. Skips quietly when there are no new articles or
 * no subscribers. Best-effort — never throws (so the scheduled job can't fail).
 */
export async function sendDailyDigest() {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const articles = await Article.find({
      status: 'published',
      deleted_at: null,
      published_at: { $gte: since },
      'moderation.model': OWN_ARTICLE_MODEL,
    })
      .select('title slug excerpt cover_image_url cover_image_alt published_at')
      .sort({ published_at: -1 })
      .limit(20)
      .lean();

    if (!articles.length) {
      logger.info('newsletter digest: no new articles in last 24h — skipping');
      return { skipped: true, reason: 'no_articles' };
    }

    const subs = await NewsletterSubscriber.find({ status: 'subscribed' })
      .select('email')
      .lean();
    if (!subs.length) {
      logger.info('newsletter digest: no active subscribers — skipping');
      return { skipped: true, reason: 'no_subscribers' };
    }

    const messages = subs.map((s) => {
      const url = unsubscribeUrl(s.email);
      const { subject, html } = dailyDigestTemplate({ articles, unsubscribeUrl: url });
      return {
        to: s.email,
        subject,
        html,
        // RFC 8058 one-click unsubscribe — required by Gmail/Yahoo for bulk mail.
        headers: {
          'List-Unsubscribe': `<${url}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
    });

    const result = await sendBatchEmails(messages);
    logger.info(
      { articles: articles.length, subscribers: subs.length, ...result },
      'newsletter digest sent',
    );
    return { articles: articles.length, subscribers: subs.length, ...result };
  } catch (err) {
    logger.error({ err: err.message }, 'newsletter digest failed');
    return { error: err.message };
  }
}
