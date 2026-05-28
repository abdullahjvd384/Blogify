import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired, authOptional } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  articleIdParamSchema,
  commentIdParamSchema,
  listCommentsQuerySchema,
  createCommentSchema,
  editCommentSchema,
} from './comments.validators.js';
import * as ctrl from './comments.controller.js';

// Mounted at /articles/:id/comments — keeps comments next to the article resource.
const router = Router({ mergeParams: true });

router.get(
  '/',
  authOptional,
  validate(articleIdParamSchema, 'params'),
  validate(listCommentsQuerySchema, 'query'),
  asyncHandler(ctrl.list),
);

router.post(
  '/',
  authRequired,
  validate(articleIdParamSchema, 'params'),
  validate(createCommentSchema),
  asyncHandler(ctrl.create),
);

router.patch(
  '/:commentId',
  authRequired,
  validate(commentIdParamSchema, 'params'),
  validate(editCommentSchema),
  asyncHandler(ctrl.edit),
);

router.delete(
  '/:commentId',
  authRequired,
  validate(commentIdParamSchema, 'params'),
  asyncHandler(ctrl.remove),
);

export { router as commentsRouter };
