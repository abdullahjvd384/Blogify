import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { articleIdParamSchema, bookmarkListQuerySchema } from './bookmarks.validators.js';
import * as ctrl from './bookmarks.controller.js';

// Mounted at /me/bookmarks — all routes require auth.
const router = Router();

router.get('/', authRequired, validate(bookmarkListQuerySchema, 'query'), asyncHandler(ctrl.list));

router.get(
  '/:articleId',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  asyncHandler(ctrl.isSaved),
);

router.put(
  '/:articleId',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  asyncHandler(ctrl.save),
);

router.delete(
  '/:articleId',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  asyncHandler(ctrl.remove),
);

export { router as bookmarksRouter };
