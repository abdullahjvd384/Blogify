import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { NewsletterSubscriber } from '../../models/NewsletterSubscriber.js';
import { sendEmail, newsletterWelcomeTemplate } from '../../services/email.js';
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
      const { subject, html } = newsletterWelcomeTemplate();
      sendEmail({ to: email, subject, html }).catch((err) =>
        logger.warn({ err, email }, 'newsletter welcome email failed'),
      );
    }

    res.status(201).json({ data: { ok: true } });
  }),
);

export { router as newsletterRouter };
