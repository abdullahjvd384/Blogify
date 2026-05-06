import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import * as ctrl from './subscriptions.controller.js';

const router = Router();

router.get('/plans', asyncHandler(ctrl.listPlans));
router.get('/me', authRequired, asyncHandler(ctrl.getMine));

export { router as subscriptionsRouter };
