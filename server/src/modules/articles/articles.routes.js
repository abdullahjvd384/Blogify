import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired, authOptional } from '../../middleware/auth.js';
import { requireFreshRole } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import {
  createArticleSchema,
  updateArticleSchema,
  articleIdParamSchema,
  articleSlugParamSchema,
  feedQuerySchema,
  minePagedQuerySchema,
} from './articles.validators.js';
import * as ctrl from './articles.controller.js';
import { votesRouter } from '../votes/votes.routes.js';
import { commentsRouter } from '../comments/comments.routes.js';

const router = Router();

// Listing endpoints first so /mine and /following don't get swallowed by /:slug.
router.get('/', validate(feedQuerySchema, 'query'), asyncHandler(ctrl.listFeed));
router.get(
  '/following',
  authRequired,
  validate(feedQuerySchema, 'query'),
  asyncHandler(ctrl.listFollowingFeed),
);
router.get(
  '/for-you',
  authRequired,
  validate(feedQuerySchema, 'query'),
  asyncHandler(ctrl.listForYou),
);
router.get(
  '/mine',
  authRequired,
  validate(minePagedQuerySchema, 'query'),
  asyncHandler(ctrl.listMine),
);

router.get('/mine/stats', authRequired, requireFreshRole('writer'), asyncHandler(ctrl.getMyStats));

router.get(
  '/mine/:id',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  asyncHandler(ctrl.getMineById),
);

// Public read: anonymous visitors can read free stories. Member-only stories
// still require (at least) a logged-in account so the monthly meter applies —
// enforced in the service. authOptional attaches req.user when a valid token
// is present and treats everyone else as anonymous.
router.get(
  '/:slug',
  authOptional,
  validate(articleSlugParamSchema, 'params'),
  asyncHandler(ctrl.getBySlug),
);

router.post(
  '/',
  authRequired,
  requireFreshRole('writer'),
  validate(createArticleSchema),
  asyncHandler(ctrl.create),
);

router.patch(
  '/:id',
  authRequired,
  requireFreshRole('writer'),
  validate(articleIdParamSchema, 'params'),
  validate(updateArticleSchema),
  asyncHandler(ctrl.update),
);

router.delete(
  '/:id',
  authRequired,
  requireFreshRole('writer'),
  validate(articleIdParamSchema, 'params'),
  asyncHandler(ctrl.remove),
);

router.post(
  '/:id/submit',
  authRequired,
  requireFreshRole('writer'),
  validate(articleIdParamSchema, 'params'),
  asyncHandler(ctrl.submit),
);

router.use('/:id/vote', votesRouter);
router.use('/:id/comments', commentsRouter);

export { router as articlesRouter };
