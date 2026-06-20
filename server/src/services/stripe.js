import crypto from 'node:crypto';
import Stripe from 'stripe';
import { CURRENCY } from '@blogplatform/shared';
import { env } from '../config/env.js';

let client = null;

/** Lazily build the Stripe client so the app boots even when keys are unset. */
function getClient() {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!client) client = new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}

/** True when Stripe is configured (secret key present). */
export function isConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY);
}

/** Unique, URL-safe reference we store on the Payment and pass to Stripe metadata. */
export function generateRef() {
  return `stripe_${crypto.randomBytes(12).toString('hex')}`;
}

/**
 * Create a hosted Stripe Checkout Session for a one-time membership purchase.
 * We use `payment` mode (one charge per billing cycle) to mirror the app's
 * existing period-based activation, and pass our own ref + plan in metadata so
 * the webhook can match the payment back to the pending row.
 */
export async function createCheckoutSession({
  ref,
  amountCents,
  planLabel,
  planKey,
  billingCycle,
  userId,
  customerEmail,
  successUrl,
  cancelUrl,
}) {
  const stripe = getClient();
  if (!stripe) throw new Error('Stripe is not configured');

  const interval = billingCycle === 'annual' ? 'year' : 'month';

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail || undefined,
    client_reference_id: userId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY.code.toLowerCase(),
          unit_amount: amountCents,
          product_data: {
            name: `Blogify ${planLabel} membership`,
            description: `Billed ${billingCycle} ($ per ${interval})`,
          },
        },
      },
    ],
    metadata: { ref, planKey, billingCycle, userId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

/**
 * Verify + parse a webhook payload using the raw request body and signature.
 * Throws if the signature is invalid or the webhook secret is unset.
 */
export function constructEvent(rawBody, signature) {
  const stripe = getClient();
  if (!stripe) throw new Error('Stripe is not configured');
  if (!env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}
