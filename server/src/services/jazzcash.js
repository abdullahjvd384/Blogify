import crypto from 'node:crypto';
import { env } from '../config/env.js';

/**
 * JazzCash Hosted Checkout (sandbox) integration.
 *
 * Flow:
 *   1. Server builds the form payload + secure hash
 *   2. Client renders an auto-submitting form to JC's sandbox URL
 *   3. JC processes payment and POSTs the user back to our pp_ReturnURL
 *   4. We verify the secure hash on that POST and finalize the payment
 *
 * Sandbox endpoint:
 *   https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/
 *
 * Hash spec (canonical):
 *   - Take all pp_* and ppmpf_* fields except pp_SecureHash
 *   - Drop empty values
 *   - Sort by key (ASCII)
 *   - Join values with '&'
 *   - Prepend the integrity salt joined with '&'
 *   - HMAC-SHA256 with the integrity salt as the secret
 *   - Hex-encode upper-case
 */

const SANDBOX_URL =
  'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';

export const JAZZCASH_FORM_URL = SANDBOX_URL;

export function isConfigured() {
  return Boolean(
    env.JAZZCASH_MERCHANT_ID &&
      env.JAZZCASH_PASSWORD &&
      env.JAZZCASH_INTEGRITY_SALT &&
      env.JAZZCASH_RETURN_URL,
  );
}

/**
 * Build a fresh checkout payload and its secure hash.
 *
 * @param {object} input
 * @param {string} input.txnRefNo  unique merchant txn id (we generate this)
 * @param {number} input.amountPaisa  amount in paisa (lowest unit)
 * @param {string} input.description  human-readable line item
 * @param {string} input.billRef  pass-through (we use the user id)
 * @param {string} [input.userIdPassThrough] put on ppmpf_1 so the webhook can
 *   identify the user without trusting query params
 */
export function buildCheckoutForm(input) {
  if (!isConfigured()) {
    throw new Error('JazzCash sandbox is not configured (missing env vars)');
  }
  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000);

  const fields = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Language: 'EN',
    pp_MerchantID: env.JAZZCASH_MERCHANT_ID,
    pp_SubMerchantID: '',
    pp_Password: env.JAZZCASH_PASSWORD,
    pp_BankID: '',
    pp_ProductID: '',
    pp_TxnRefNo: input.txnRefNo,
    pp_Amount: String(input.amountPaisa),
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: formatJcDate(now),
    pp_BillReference: input.billRef || 'subscription',
    pp_Description: (input.description || 'Subscription upgrade').slice(0, 50),
    pp_TxnExpiryDateTime: formatJcDate(expiry),
    pp_ReturnURL: env.JAZZCASH_RETURN_URL,
    ppmpf_1: input.userIdPassThrough || '',
    ppmpf_2: input.planKey || '',
    ppmpf_3: '',
    ppmpf_4: '',
    ppmpf_5: '',
  };

  const secureHash = computeSecureHash(fields, env.JAZZCASH_INTEGRITY_SALT);
  return {
    formUrl: SANDBOX_URL,
    fields: { ...fields, pp_SecureHash: secureHash },
  };
}

/**
 * Verify a payload received from JazzCash. Returns true iff the recomputed
 * hash matches `pp_SecureHash`. Constant-time comparison guards against
 * timing oracles.
 */
export function verifySecureHash(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const provided = payload.pp_SecureHash;
  if (!provided || typeof provided !== 'string') return false;

  const stripped = { ...payload };
  delete stripped.pp_SecureHash;
  const expected = computeSecureHash(stripped, env.JAZZCASH_INTEGRITY_SALT);

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(provided.toUpperCase(), 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Internal: build the canonical hash input and HMAC it. */
function computeSecureHash(fields, salt) {
  const keys = Object.keys(fields)
    .filter((k) => k !== 'pp_SecureHash')
    .sort();
  const values = keys
    .map((k) => fields[k])
    .filter((v) => v !== undefined && v !== null && String(v).length > 0)
    .map((v) => String(v));
  const message = [salt, ...values].join('&');
  return crypto.createHmac('sha256', salt).update(message).digest('hex').toUpperCase();
}

/** JazzCash expects `yyyyMMddHHmmss` in UTC-ish local format. */
function formatJcDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds()),
  ].join('');
}

/** Generates a unique-ish, alphanumeric, ≤20-char txn reference. */
export function generateTxnRefNo() {
  const ts = formatJcDate(new Date()).slice(2); // 12 chars yyMMddHHmmss
  const rand = crypto.randomBytes(3).toString('hex'); // 6 chars
  return `T${ts}${rand}`.slice(0, 20);
}
