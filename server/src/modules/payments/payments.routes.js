import { Router } from 'express';
import express from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { checkoutBodySchema, txnRefParamSchema } from './payments.validators.js';
import * as ctrl from './payments.controller.js';

const router = Router();

router.post(
  '/checkout',
  authRequired,
  validate(checkoutBodySchema),
  asyncHandler(ctrl.checkout),
);

// JazzCash sandbox posts the result form-urlencoded; the global JSON parser
// won't catch it, so attach a urlencoded parser scoped to this route.
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
