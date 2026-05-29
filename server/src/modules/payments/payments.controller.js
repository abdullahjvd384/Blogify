import * as service from './payments.service.js';
import { env } from '../../config/env.js';
import { ok, created } from '../../utils/response.js';
import { present, presentMany } from '../../utils/presenter.js';
import { PLANS } from '@blogplatform/shared';

/** Build the user-facing return URL from server config + result params. */
function buildReturnUrl({ txnRefNo, status, planKey }) {
  const base = env.CLIENT_ORIGIN.replace(/\/$/, '');
  const qs = new URLSearchParams({ txn: txnRefNo, status, ...(planKey ? { plan: planKey } : {}) });
  return `${base}/payments/return?${qs.toString()}`;
}

export async function checkout(req, res) {
  const result = await service.createCheckout(
    req.user.id,
    req.valid.body.planKey,
    req.valid.body.billingCycle,
  );
  return created(res, result);
}

/**
 * JazzCash redirects the user's browser back here as a POST. We finalize the
 * payment server-side, then 302 the user to the SPA's return page so they
 * don't see raw form data in the URL.
 */
export async function jazzcashWebhook(req, res) {
  const payload = req.body || {};
  let result;
  try {
    result = await service.handleWebhook(payload);
  } catch (err) {
    return res.redirect(
      302,
      buildReturnUrl({
        txnRefNo: payload.pp_TxnRefNo || 'unknown',
        status: 'error',
        planKey: payload.ppmpf_2,
      }) + `&message=${encodeURIComponent(err.message || 'Payment processing failed')}`,
    );
  }

  return res.redirect(302, buildReturnUrl(result));
}

export async function getStatus(req, res) {
  const result = await service.getStatus(req.user.id, req.valid.params.txnRefNo);
  return ok(res, result);
}

/** Public-ish: the JazzCash receiver number + plan price table the UI shows. */
export async function getPaymentInfo(_req, res) {
  return ok(res, {
    receiver: {
      number: env.JAZZCASH_RECEIVER_NUMBER,
      name: env.JAZZCASH_RECEIVER_NAME,
      currency: 'PKR',
    },
    plans: Object.values(PLANS).filter((p) => p.pricePaisaMonthly > 0),
  });
}

export async function submitManual(req, res) {
  const payment = await service.submitManualPayment(req.user.id, req.valid.body);
  return created(res, { payment: present(payment) });
}

export async function listMine(req, res) {
  const items = await service.listMyPayments(req.user.id, req.valid.query);
  return ok(res, { payments: presentMany(items) });
}

// ---- Admin handlers ----

export async function adminList(req, res) {
  const items = await service.adminListPayments(req.valid.query);
  return ok(res, { payments: presentMany(items) });
}

export async function adminApprove(req, res) {
  const payment = await service.adminApprovePayment(req.valid.params.id, req.user);
  return ok(res, { payment: present(payment) });
}

export async function adminReject(req, res) {
  const payment = await service.adminRejectPayment(
    req.valid.params.id,
    req.user,
    req.valid.body,
  );
  return ok(res, { payment: present(payment) });
}
