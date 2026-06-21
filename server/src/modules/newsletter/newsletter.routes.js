import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { NewsletterSubscriber } from '../../models/NewsletterSubscriber.js';

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
    await NewsletterSubscriber.updateOne(
      { email },
      { $setOnInsert: { email, source: source || 'site', status: 'subscribed' } },
      { upsert: true },
    );
    res.status(201).json({ data: { ok: true } });
  }),
);

export { router as newsletterRouter };
