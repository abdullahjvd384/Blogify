import { PLANS, DEFAULT_PLAN } from '@blogplatform/shared';
import { Payment } from '../../models/Payment.js';
import { Subscription } from '../../models/Subscription.js';
import {
  buildCheckoutForm,
  verifySecureHash,
  generateTxnRefNo,
  isConfigured,
} from '../../services/jazzcash.js';
import {
  ConflictError,
  NotFoundError,
  PaymentError,
  ValidationError,
} from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

const SUCCESS_RESPONSE_CODE = '000';
const PERIOD_DAYS = 30;

/**
 * Build a JazzCash checkout for upgrading the caller to `planKey`.
 *
 * Behavior:
 *   - Validates the plan key is paid (free can't be "checkout-ed")
 *   - Creates a Payment row in `pending` so we can match the webhook later
 *   - Returns the form URL + fields for the client to render an auto-submitting form
 */
export async function createCheckout(userId, planKey) {
  if (!isConfigured()) {
    throw new PaymentError('Payments are not configured on this server');
  }

  const plan = PLANS[planKey];
  if (!plan) throw new ValidationError(`Unknown plan: ${planKey}`);
  if (planKey === DEFAULT_PLAN || plan.pricePaisa === 0) {
    throw new ValidationError('That plan is not purchasable');
  }

  const txnRefNo = generateTxnRefNo();
  const form = buildCheckoutForm({
    txnRefNo,
    amountPaisa: plan.pricePaisa,
    description: `${plan.label} subscription`,
    billRef: userId.toString(),
    userIdPassThrough: userId.toString(),
    planKey,
  });

  await Payment.create({
    user_id: userId,
    provider: 'jazzcash',
    txn_ref_no: txnRefNo,
    plan_key: planKey,
    amount_paisa: plan.pricePaisa,
    currency: 'PKR',
    status: 'pending',
    raw_request: form.fields,
  });

  return {
    txnRefNo,
    formUrl: form.formUrl,
    fields: form.fields,
  };
}

/**
 * Process a JazzCash callback. Idempotent — re-running with the same payload
 * leaves the Payment in the same terminal state and doesn't double-extend the
 * subscription.
 *
 * Returns { txnRefNo, status, planKey } so the controller can decide which
 * `/payments/return?...` URL to redirect the user to.
 */
export async function handleWebhook(payload) {
  const txnRefNo = payload.pp_TxnRefNo;
  if (!txnRefNo) throw new ValidationError('Missing pp_TxnRefNo');

  if (!verifySecureHash(payload)) {
    logger.warn({ txnRefNo }, 'jazzcash signature mismatch');
    throw new PaymentError('Signature verification failed');
  }

  const payment = await Payment.findOne({ txn_ref_no: txnRefNo, provider: 'jazzcash' });
  if (!payment) throw new NotFoundError('Payment not found');

  // If the payment is already in a terminal state, we still ack the callback
  // (JazzCash may re-deliver) but don't re-mutate state.
  if (payment.status === 'success' || payment.status === 'failed') {
    return {
      txnRefNo,
      status: payment.status,
      planKey: payment.plan_key,
      idempotent: true,
    };
  }

  payment.raw_response = payload;
  payment.response_code = String(payload.pp_ResponseCode || '');
  payment.response_message = String(payload.pp_ResponseMessage || '');
  payment.completed_at = new Date();

  if (payment.response_code === SUCCESS_RESPONSE_CODE) {
    payment.status = 'success';
    await payment.save();
    await activateSubscription(payment);
    return { txnRefNo, status: 'success', planKey: payment.plan_key };
  }

  payment.status = 'failed';
  payment.error = payment.response_message || `code=${payment.response_code}`;
  await payment.save();
  return { txnRefNo, status: 'failed', planKey: payment.plan_key };
}

/**
 * Status read for the frontend's polling page. Returns just the bits the UI
 * needs — not the full raw_request/response, since that contains secrets.
 */
export async function getStatus(userId, txnRefNo) {
  const payment = await Payment.findOne({ txn_ref_no: txnRefNo, user_id: userId }).lean();
  if (!payment) throw new NotFoundError('Payment not found');
  return {
    txnRefNo: payment.txn_ref_no,
    status: payment.status,
    planKey: payment.plan_key,
    amountPaisa: payment.amount_paisa,
    currency: payment.currency,
    completedAt: payment.completed_at,
    responseMessage: payment.response_message,
  };
}

async function activateSubscription(payment) {
  const sub = await Subscription.findOne({ user_id: payment.user_id });
  if (!sub) {
    // Defensive: every user gets one at signup, but if we ever miss, create.
    await Subscription.create({
      user_id: payment.user_id,
      plan: payment.plan_key,
      status: 'active',
      started_at: new Date(),
      current_period_end: addDays(new Date(), PERIOD_DAYS),
      last_payment_id: payment._id.toString(),
    });
    payment.subscription_id = (
      await Subscription.findOne({ user_id: payment.user_id }, { _id: 1 })
    )._id;
    await payment.save();
    return;
  }

  // Stack period if same-plan renewal; otherwise upgrade and start fresh.
  const isRenewal = sub.plan === payment.plan_key && sub.status === 'active';
  const base =
    isRenewal && sub.current_period_end && sub.current_period_end > new Date()
      ? sub.current_period_end
      : new Date();

  sub.plan = payment.plan_key;
  sub.status = 'active';
  sub.cancel_at_period_end = false;
  sub.current_period_end = addDays(base, PERIOD_DAYS);
  sub.last_payment_id = payment._id.toString();
  await sub.save();

  payment.subscription_id = sub._id;
  await payment.save();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Manually mark a payment refunded. Admin-only flow (Day 14). Exposed here so
 * the future admin module can call it.
 */
export async function markRefunded(txnRefNo, reason) {
  const payment = await Payment.findOne({ txn_ref_no: txnRefNo });
  if (!payment) throw new NotFoundError('Payment not found');
  if (payment.status !== 'success') {
    throw new ConflictError('Only successful payments can be refunded');
  }
  payment.status = 'refunded';
  payment.error = reason || null;
  await payment.save();
  return payment.toObject();
}
