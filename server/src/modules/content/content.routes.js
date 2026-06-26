import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { requireFreshRole } from '../../middleware/roles.js';
import { enqueueContentNow, enqueueDigestNow } from '../../queues/content.js';

const router = Router();

// Admin-only: trigger an immediate auto-content generation run (for testing /
// on-demand posts). Requires the content worker to be running (XAI configured).
router.post(
  '/generate',
  authRequired,
  requireFreshRole('admin'),
  asyncHandler(async (req, res) => {
    const count = Math.max(1, Math.min(3, Number(req.body?.count) || 1));
    const job = await enqueueContentNow(count);
    res.status(202).json({ data: { enqueued: true, jobId: job.id, count } });
  }),
);

// Admin-only: send the newsletter digest now (the day's DevCrunch articles to
// all subscribers). Requires the content worker to be running.
router.post(
  '/digest',
  authRequired,
  requireFreshRole('admin'),
  asyncHandler(async (_req, res) => {
    const job = await enqueueDigestNow();
    res.status(202).json({ data: { enqueued: true, jobId: job.id } });
  }),
);

export { router as contentRouter };
