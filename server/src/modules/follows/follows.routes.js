import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired, authOptional } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { userIdParamSchema, followListQuerySchema } from './follows.validators.js';
import * as ctrl from './follows.controller.js';

// Mounted at /users — public social actions on a user (distinct from /admin/users).
const router = Router();

router.post(
  '/:id/follow',
  authRequired,
  validate(userIdParamSchema, 'params'),
  asyncHandler(ctrl.follow),
);

router.delete(
  '/:id/follow',
  authRequired,
  validate(userIdParamSchema, 'params'),
  asyncHandler(ctrl.unfollow),
);

router.get(
  '/:id/followers',
  authOptional,
  validate(userIdParamSchema, 'params'),
  validate(followListQuerySchema, 'query'),
  asyncHandler(ctrl.listFollowers),
);

router.get(
  '/:id/following',
  authOptional,
  validate(userIdParamSchema, 'params'),
  validate(followListQuerySchema, 'query'),
  asyncHandler(ctrl.listFollowing),
);

export { router as usersPublicRouter };
