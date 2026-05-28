import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired, authOptional } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { tagParamSchema } from './tags.validators.js';
import * as ctrl from './tags.controller.js';

const router = Router();

// Static path first so it isn't captured by /:tag.
router.get('/me/following', authRequired, asyncHandler(ctrl.listFollowed));

router.get('/:tag', authOptional, validate(tagParamSchema, 'params'), asyncHandler(ctrl.getTag));
router.post('/:tag/follow', authRequired, validate(tagParamSchema, 'params'), asyncHandler(ctrl.follow));
router.delete('/:tag/follow', authRequired, validate(tagParamSchema, 'params'), asyncHandler(ctrl.unfollow));

export { router as tagsRouter };
