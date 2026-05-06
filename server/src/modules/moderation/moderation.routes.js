import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import {
  moderationIdParamSchema,
  moderationQueueQuerySchema,
  adminApproveBodySchema,
  adminRejectBodySchema,
} from './moderation.validators.js';
import * as ctrl from './moderation.controller.js';

// All routes are admin-only — mount under /admin/moderation in routes.js.
const router = Router();
router.use(authRequired, requireRole('admin'));

router.get('/', validate(moderationQueueQuerySchema, 'query'), asyncHandler(ctrl.listQueue));

router.post(
  '/:id/approve',
  validate(moderationIdParamSchema, 'params'),
  validate(adminApproveBodySchema),
  asyncHandler(ctrl.approve),
);

router.post(
  '/:id/reject',
  validate(moderationIdParamSchema, 'params'),
  validate(adminRejectBodySchema),
  asyncHandler(ctrl.reject),
);

router.post(
  '/:id/retry',
  validate(moderationIdParamSchema, 'params'),
  asyncHandler(ctrl.retry),
);

export { router as moderationRouter };
