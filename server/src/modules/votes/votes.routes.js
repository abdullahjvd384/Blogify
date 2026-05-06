import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { articleIdParamSchema, castVoteBodySchema } from './votes.validators.js';
import * as ctrl from './votes.controller.js';

// Mounted at /articles/:id/vote — keeps voting next to the article resource.
const router = Router({ mergeParams: true });

router.post(
  '/',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  validate(castVoteBodySchema),
  asyncHandler(ctrl.cast),
);

router.delete(
  '/',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  asyncHandler(ctrl.clear),
);

export { router as votesRouter };
