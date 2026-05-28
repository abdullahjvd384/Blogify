import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authOptional } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { handleParamSchema, profileFeedQuerySchema } from './profiles.validators.js';
import * as ctrl from './profiles.controller.js';

const router = Router();

router.get(
  '/:handle',
  authOptional,
  validate(handleParamSchema, 'params'),
  asyncHandler(ctrl.getProfile),
);

router.get(
  '/:handle/articles',
  authOptional,
  validate(handleParamSchema, 'params'),
  validate(profileFeedQuerySchema, 'query'),
  asyncHandler(ctrl.listArticles),
);

export { router as profilesRouter };
