import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { notificationListQuerySchema, notificationIdParamSchema } from './notifications.validators.js';
import * as ctrl from './notifications.controller.js';

const router = Router();

router.get('/', authRequired, validate(notificationListQuerySchema, 'query'), asyncHandler(ctrl.list));
router.get('/unread-count', authRequired, asyncHandler(ctrl.unreadCount));
router.post('/read-all', authRequired, asyncHandler(ctrl.markAllRead));
router.post(
  '/:id/read',
  authRequired,
  validate(notificationIdParamSchema, 'params'),
  asyncHandler(ctrl.markRead),
);

export { router as notificationsRouter };
