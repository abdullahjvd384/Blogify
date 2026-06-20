import mongoose from 'mongoose';
import { PLANS, DEFAULT_PLAN } from '@blogplatform/shared';
import { Payment } from '../../models/Payment.js';
import { Subscription } from '../../models/Subscription.js';
import { User } from '../../models/User.js';
import {
  buildCheckoutForm,
  verifySecureHash,
  generateTxnRefNo,
  isConfigured,
} from '../../services/jazzcash.js';
import {
  isConfigured as isStripeConfigured,
  generateRef,
  createCheckoutSession,
} from '../../services/stripe.js';
import { env } from '../../config/env.js';
import {
  ConflictError,
  NotFoundError,
  PaymentError,
  ValidationError,
} from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

const SUCCESS_RESPONSE_CODE = '000';
const PERIOD_DAYS = { monthly: 30, annual: 365 };

/** Price in paisa for a plan + billing cycle. */
function priceFor(plan, billingCycle) {
  return billingCycle === 'annual' ? plan.pricePaisaAnnual : plan.pricePaisaMonthly;
}

function periodDaysFor(billingCycle) {
  return PERIOD_DAYS[billingCycle] || PERIOD_DAYS.monthly;
}

/**
 * Build a JazzCash checkout for upgrading the caller to `planKey`.
 *
 * Behavior:
 *   - Validates the plan key is paid (free can't be "checkout-ed")
 *   - Creates a Payment row in `pending` so we can match the webhook later
 *   - Returns the form URL + fields for the client to render an auto-submitting form
 */
export async function createCheckout(userId, planKey, billingCycle = 'monthly') {
  if (!isConfigured()) {
    throw new PaymentError('Payments are not configured on this server');
  }

  const plan = PLANS[planKey];
  if (!plan) throw new ValidationError(`Unknown plan: ${planKey}`);
  const amountPaisa = priceFor(plan, billingCycle);
  if (planKey === DEFAULT_PLAN || !amountPaisa) {
    throw new ValidationError('That plan is not purchasable');
  }

  const txnRefNo = generateTxnRefNo();
  const form = buildCheckoutForm({
    txnRefNo,
    amountPaisa,
    description: `${plan.label} membership (${billingCycle})`,
    billRef: userId.toString(),
    userIdPassThrough: userId.toString(),
    planKey,
  });

  await Payment.create({
    user_id: userId,
    provider: 'jazzcash',
    txn_ref_no: txnRefNo,
    plan_key: planKey,
    billing_cycle: billingCycle,
    amount_paisa: amountPaisa,
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
 * Create a Stripe Checkout Session for upgrading the caller to `planKey`.
 * Records a `pending` Payment (provider 'stripe') keyed by our own ref, which we
 * also pass to Stripe as metadata so the webhook can match it back. Returns the
 * hosted Checkout URL for the client to redirect to.
 */
export async function createStripeCheckout(userId, planKey, billingCycle = 'monthly', userEmail) {
  if (!isStripeConfigured()) {
    throw new PaymentError('Card payments are not configured on this server');
  }

  const plan = PLANS[planKey];
  if (!plan) throw new ValidationError(`Unknown plan: ${planKey}`);
  const amountCents = priceFor(plan, billingCycle);
  if (planKey === DEFAULT_PLAN || !amountCents) {
    throw new ValidationError('That plan is not purchasable');
  }

  const ref = generateRef();
  const base = env.CLIENT_ORIGIN.replace(/\/$/, '');
  const successUrl = `${base}/payments/return?txn=${encodeURIComponent(ref)}&status=pending&plan=${planKey}`;
  const cancelUrl = `${base}/pricing?canceled=1`;

  const session = await createCheckoutSession({
    ref,
    amountCents,
    planLabel: plan.label,
    planKey,
    billingCycle,
    userId: userId.toString(),
    customerEmail: userEmail,
    successUrl,
    cancelUrl,
  });

  await Payment.create({
    user_id: userId,
    provider: 'stripe',
    txn_ref_no: ref,
    plan_key: planKey,
    billing_cycle: billingCycle,
    amount_paisa: amountCents,
    currency: 'USD',
    status: 'pending',
    raw_request: { source: 'stripe_checkout', sessionId: session.id },
  });

  return { url: session.url, ref };
}

/**
 * Handle a verified Stripe webhook event. We only act on
 * `checkout.session.completed` with a paid status: mark the matching Payment
 * success and activate the subscription. Idempotent — Stripe may redeliver.
 */
export async function handleStripeWebhook(event) {
  if (event.type !== 'checkout.session.completed') return { handled: false };

  const session = event.data.object;
  if (session.payment_status !== 'paid') return { handled: false };

  const ref = session.metadata?.ref;
  if (!ref) {
    logger.warn({ sessionId: session.id }, 'stripe webhook missing ref metadata');
    return { handled: false };
  }

  const payment = await Payment.findOne({ txn_ref_no: ref, provider: 'stripe' });
  if (!payment) {
    logger.warn({ ref, sessionId: session.id }, 'stripe webhook: payment not found');
    return { handled: false };
  }
  if (payment.status === 'success') return { handled: true, idempotent: true };

  payment.status = 'success';
  payment.completed_at = new Date();
  payment.response_code = 'paid';
  payment.response_message = 'Stripe checkout completed';
  payment.raw_response = {
    sessionId: session.id,
    paymentIntent: session.payment_intent,
    amountTotal: session.amount_total,
    currency: session.currency,
  };
  await payment.save();
  await activateSubscription(payment);

  return { handled: true, planKey: payment.plan_key };
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
  const days = periodDaysFor(payment.billing_cycle);
  const sub = await Subscription.findOne({ user_id: payment.user_id });
  if (!sub) {
    // Defensive: every user gets one at signup, but if we ever miss, create.
    const created = await Subscription.create({
      user_id: payment.user_id,
      plan: payment.plan_key,
      billing_cycle: payment.billing_cycle,
      status: 'active',
      started_at: new Date(),
      current_period_end: addDays(new Date(), days),
      last_payment_id: payment._id.toString(),
    });
    payment.subscription_id = created._id;
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
  sub.billing_cycle = payment.billing_cycle;
  sub.status = 'active';
  sub.cancel_at_period_end = false;
  sub.current_period_end = addDays(base, days);
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
 * Manual JazzCash flow: user paid the receiving account out-of-band and now
 * submits their JazzCash Transaction ID + sender phone as proof. We record a
 * `pending` Payment row; an admin reviews and approves/rejects from the
 * admin dashboard.
 *
 * Idempotency: the same TID can't be submitted twice — unique index on
 * txn_ref_no surfaces as ConflictError so the user can't double-claim.
 */
export async function submitManualPayment(userId, { planKey, billingCycle = 'monthly', txnRefNo, senderPhone, note }) {
  const plan = PLANS[planKey];
  if (!plan) throw new ValidationError(`Unknown plan: ${planKey}`);
  const amountPaisa = priceFor(plan, billingCycle);
  if (planKey === DEFAULT_PLAN || !amountPaisa) {
    throw new ValidationError('That plan is not purchasable');
  }

  // Don't accept duplicate TIDs (whether the existing one belongs to this user
  // or another). One TID = one claim.
  const existing = await Payment.findOne({ txn_ref_no: txnRefNo }).lean();
  if (existing) {
    throw new ConflictError(
      'This Transaction ID has already been submitted. If you believe this is in error, contact support.',
    );
  }

  const payment = await Payment.create({
    user_id: userId,
    provider: 'jazzcash',
    txn_ref_no: txnRefNo,
    plan_key: planKey,
    billing_cycle: billingCycle,
    amount_paisa: amountPaisa,
    currency: 'PKR',
    status: 'pending',
    sender_phone: senderPhone,
    proof_note: note || null,
    raw_request: { source: 'manual_submit', planKey, billingCycle, senderPhone, note: note || null },
  });

  return payment.toObject();
}

/** List the current user's payment submissions, newest first. */
export async function listMyPayments(userId, { limit }) {
  const items = await Payment.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
  return items;
}

/**
 * Admin: list all payment submissions, optionally filtered by status. Enriches
 * each row with author summary so the admin doesn't need to cross-reference
 * user IDs.
 */
export async function adminListPayments({ status, limit }) {
  const filter = {};
  if (status) filter.status = status;

  const items = await Payment.find(filter).sort({ created_at: -1 }).limit(limit).lean();
  if (!items.length) return items;

  const userIds = [...new Set(items.map((p) => p.user_id.toString()))];
  const users = await User.find(
    { _id: { $in: userIds } },
    { name: 1, email: 1, role: 1 },
  ).lean();
  const byId = new Map(users.map((u) => [u._id.toString(), u]));

  return items.map((p) => ({
    ...p,
    user: byId.get(p.user_id.toString()) || null,
  }));
}

/**
 * Admin approves a manually-submitted payment. Activates / extends the user's
 * subscription for 30 days. Idempotent: re-running on an approved payment is
 * a no-op (returns the existing record), not a double-extension.
 */
export async function adminApprovePayment(paymentId, admin) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new NotFoundError('Payment not found');
  if (payment.status === 'success') return payment.toObject(); // idempotent
  if (payment.status === 'failed') {
    throw new ConflictError('Payment was already rejected — cannot approve');
  }
  if (payment.status === 'refunded') {
    throw new ConflictError('Payment was refunded');
  }

  payment.status = 'success';
  payment.completed_at = new Date();
  payment.verified_by_id = new mongoose.Types.ObjectId(admin.id);
  payment.verified_at = new Date();
  await payment.save();

  await activateSubscription(payment);
  return payment.toObject();
}

/** Admin rejects a payment submission with a reason (shown to the user). */
export async function adminRejectPayment(paymentId, admin, { reason }) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new NotFoundError('Payment not found');
  if (payment.status === 'failed') return payment.toObject(); // idempotent
  if (payment.status === 'success') {
    throw new ConflictError('Payment was already approved — cannot reject');
  }

  payment.status = 'failed';
  payment.error = reason;
  payment.completed_at = new Date();
  payment.verified_by_id = new mongoose.Types.ObjectId(admin.id);
  payment.verified_at = new Date();
  await payment.save();

  return payment.toObject();
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
