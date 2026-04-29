import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired, authOptional } from '../../middleware/auth.js';
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
  '/:slug',
  authOptional,
  validate(articleSlugParamSchema, 'params'),
  asyncHandler(ctrl.getBySlug),
);

router.post(
  '/',
  authRequired,
  validate(createArticleSchema),
  asyncHandler(ctrl.create),
);

router.patch(
  '/:id',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  validate(updateArticleSchema),
  asyncHandler(ctrl.update),
);

router.delete(
  '/:id',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  asyncHandler(ctrl.remove),
);

router.post(
  '/:id/submit',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  asyncHandler(ctrl.submit),
);

export { router as articlesRouter };
