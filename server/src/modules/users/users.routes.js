import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import {
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from './users.validators.js';
import * as ctrl from './users.controller.js';

// All routes are admin-only — mount under /admin/users in routes.js.
const router = Router();
router.use(authRequired, requireRole('admin'));

router.get('/', validate(listUsersQuerySchema, 'query'), asyncHandler(ctrl.list));
router.get('/stats', asyncHandler(ctrl.stats));
router.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  asyncHandler(ctrl.update),
);

export { router as adminUsersRouter };
