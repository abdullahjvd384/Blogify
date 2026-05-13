import { Router } from 'express';
import express from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import {
  checkoutBodySchema,
  txnRefParamSchema,
  manualSubmitSchema,
  minePaymentsQuerySchema,
  adminPaymentsQuerySchema,
  paymentIdParamSchema,
  rejectPaymentSchema,
} from './payments.validators.js';
import * as ctrl from './payments.controller.js';

const router = Router();

// --- Manual JazzCash flow (primary) ---

router.get('/info', authRequired, asyncHandler(ctrl.getPaymentInfo));

router.post(
  '/manual-submit',
  authRequired,
  validate(manualSubmitSchema),
  asyncHandler(ctrl.submitManual),
);

router.get(
  '/mine',
  authRequired,
  validate(minePaymentsQuerySchema, 'query'),
  asyncHandler(ctrl.listMine),
);

// --- Legacy automated JazzCash sandbox flow (kept for completeness, unused in UI) ---

router.post(
  '/checkout',
  authRequired,
  validate(checkoutBodySchema),
  asyncHandler(ctrl.checkout),
);

router.post(
  '/webhook/jazzcash',
  express.urlencoded({ extended: false, limit: '64kb' }),
  asyncHandler(ctrl.jazzcashWebhook),
);

router.get(
  '/:txnRefNo',
  authRequired,
  validate(txnRefParamSchema, 'params'),
  asyncHandler(ctrl.getStatus),
);

export { router as paymentsRouter };

// --- Admin sub-router ---

const admin = Router();
admin.use(authRequired, requireRole('admin'));
admin.get('/', validate(adminPaymentsQuerySchema, 'query'), asyncHandler(ctrl.adminList));
admin.post(
  '/:id/approve',
  validate(paymentIdParamSchema, 'params'),
  asyncHandler(ctrl.adminApprove),
);
admin.post(
  '/:id/reject',
  validate(paymentIdParamSchema, 'params'),
  validate(rejectPaymentSchema),
  asyncHandler(ctrl.adminReject),
);

export { admin as adminPaymentsRouter };
