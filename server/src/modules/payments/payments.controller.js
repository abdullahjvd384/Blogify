import * as service from './payments.service.js';
import { env } from '../../config/env.js';
import { ok, created } from '../../utils/response.js';

/** Build the user-facing return URL from server config + result params. */
function buildReturnUrl({ txnRefNo, status, planKey }) {
  const base = env.CLIENT_ORIGIN.replace(/\/$/, '');
  const qs = new URLSearchParams({ txn: txnRefNo, status, ...(planKey ? { plan: planKey } : {}) });
  return `${base}/payments/return?${qs.toString()}`;
}

export async function checkout(req, res) {
  const result = await service.createCheckout(req.user.id, req.valid.body.planKey);
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
