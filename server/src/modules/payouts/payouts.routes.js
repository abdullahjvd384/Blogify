import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { requireRole, requireFreshRole } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import {
  periodQuerySchema,
  closePeriodSchema,
  requestWithdrawalSchema,
  withdrawalIdParamSchema,
  adminWithdrawalsQuerySchema,
  rejectWithdrawalSchema,
} from './payouts.validators.js';
import * as ctrl from './payouts.controller.js';

// Writer-facing: /payouts
const payoutsRouter = Router();
payoutsRouter.get('/me/earnings', authRequired, requireRole('writer'), asyncHandler(ctrl.myEarnings));
payoutsRouter.get('/me/withdrawals', authRequired, requireRole('writer'), asyncHandler(ctrl.myWithdrawals));
payoutsRouter.post(
  '/me/withdrawals',
  authRequired,
  requireFreshRole('writer'),
  validate(requestWithdrawalSchema),
  asyncHandler(ctrl.requestWithdrawal),
);

// Admin: /admin/payouts
const adminPayoutsRouter = Router();
adminPayoutsRouter.get('/periods', authRequired, requireRole('admin'), asyncHandler(ctrl.listPeriods));
adminPayoutsRouter.get(
  '/preview',
  authRequired,
  requireRole('admin'),
  validate(periodQuerySchema, 'query'),
  asyncHandler(ctrl.preview),
);
adminPayoutsRouter.post(
  '/close',
  authRequired,
  requireRole('admin'),
  validate(closePeriodSchema),
  asyncHandler(ctrl.closePeriod),
);

// Admin: /admin/withdrawals
const adminWithdrawalsRouter = Router();
adminWithdrawalsRouter.get(
  '/',
  authRequired,
  requireRole('admin'),
  validate(adminWithdrawalsQuerySchema, 'query'),
  asyncHandler(ctrl.adminListWithdrawals),
);
adminWithdrawalsRouter.post(
  '/:id/mark-paid',
  authRequired,
  requireRole('admin'),
  validate(withdrawalIdParamSchema, 'params'),
  asyncHandler(ctrl.adminMarkPaid),
);
adminWithdrawalsRouter.post(
  '/:id/reject',
  authRequired,
  requireRole('admin'),
  validate(withdrawalIdParamSchema, 'params'),
  validate(rejectWithdrawalSchema),
  asyncHandler(ctrl.adminReject),
);

export { payoutsRouter, adminPayoutsRouter, adminWithdrawalsRouter };
