import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { NewsletterSubscriber } from '../../models/NewsletterSubscriber.js';
import { sendEmail, newsletterWelcomeTemplate } from '../../services/email.js';
import { unsubscribeUrl, verifyUnsubscribe } from '../../services/newsletter.js';
import { logger } from '../../config/logger.js';

const subscribeSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  source: z.string().max(40).optional(),
});

// Light abuse guard for an unauthenticated endpoint: 10 signups / minute / IP.
const limiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post(
  '/subscribe',
  limiter,
  validate(subscribeSchema),
  asyncHandler(async (req, res) => {
    const { email, source } = req.valid.body;
    // Upsert so re-subscribing is idempotent and never leaks whether the email existed.
    const result = await NewsletterSubscriber.updateOne(
      { email },
      { $setOnInsert: { email, source: source || 'site', status: 'subscribed' } },
      { upsert: true },
    );

    // Send the welcome email only on a genuinely new signup (not re-subscribes).
    // Fire-and-forget: a mail failure must never break the subscribe response.
    if (result.upsertedCount === 1) {
      const { subject, html } = newsletterWelcomeTemplate({ unsubscribeUrl: unsubscribeUrl(email) });
      sendEmail({ to: email, subject, html }).catch((err) =>
        logger.warn({ err, email }, 'newsletter welcome email failed'),
      );
    }

    res.status(201).json({ data: { ok: true } });
  }),
);

/** Minimal HTML page shown when an unsubscribe link is opened in a browser. */
function unsubscribePage(message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>DevCrunch newsletter</title>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#eef2ee;color:#16140f;display:flex;min-height:100vh;align-items:center;justify-content:center}
.card{background:#fff;border:1px solid #e4e8e2;border-radius:16px;padding:32px 36px;max-width:440px;text-align:center}
h1{font-size:20px;margin:0 0 10px}p{color:#5c5749;font-size:15px;line-height:1.6;margin:0 0 18px}
a{color:#1f8050;font-weight:700;text-decoration:none}</style></head>
<body><div class="card"><h1>DevCrunch</h1><p>${message}</p><a href="https://devcrunch.tech">Back to DevCrunch →</a></div></body></html>`;
}

/**
 * Unsubscribe from the newsletter. Supports GET (link clicked in an email →
 * shows a confirmation page) and POST (RFC 8058 one-click from Gmail/Yahoo).
 * The email + HMAC token come from the query string in both cases.
 */
async function handleUnsubscribe(req, res) {
  const email = String(req.query.e || '').toLowerCase();
  const token = String(req.query.t || '');
  const okToken = verifyUnsubscribe(email, token);
  if (okToken) {
    await NewsletterSubscriber.updateOne({ email }, { $set: { status: 'unsubscribed' } });
    logger.info({ email }, 'newsletter unsubscribe');
  }
  if (req.method === 'POST') {
    // One-click clients only care about the status code.
    return res.status(okToken ? 200 : 400).json({ ok: okToken });
  }
  res.set('Content-Type', 'text/html; charset=utf-8');
  return res
    .status(okToken ? 200 : 400)
    .send(
      unsubscribePage(
        okToken
          ? "You've been unsubscribed from The DevCrunch brief. Sorry to see you go!"
          : 'This unsubscribe link is invalid or has expired.',
      ),
    );
}

router.get('/unsubscribe', asyncHandler(handleUnsubscribe));
router.post('/unsubscribe', asyncHandler(handleUnsubscribe));

export { router as newsletterRouter };
