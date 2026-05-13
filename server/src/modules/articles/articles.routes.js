import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
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

const router = Router();

// Listing endpoints first so /mine doesn't get swallowed by /:slug.
router.get('/', validate(feedQuerySchema, 'query'), asyncHandler(ctrl.listFeed));
router.get(
  '/mine',
  authRequired,
  validate(minePagedQuerySchema, 'query'),
  asyncHandler(ctrl.listMine),
);

router.get(
  '/mine/:id',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  asyncHandler(ctrl.getMineById),
);

router.get(
  '/:slug',
  authRequired,
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

export { router as articlesRouter };
