import mongoose from 'mongoose';
import { PAYMENT_PROVIDERS, PAYMENT_STATUSES, PLAN_KEYS } from '@blogplatform/shared';

/**
 * One Payment row per checkout attempt. The provider's transaction reference
 * is our idempotency key — duplicate webhook hits must converge on the same
 * Subscription state.
 *
 * `raw_request` / `raw_response` keep the original payloads (signature,
 * response code, etc.) so finance + support can audit any payment without
 * re-querying the provider.
 */
const paymentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    provider: { type: String, enum: PAYMENT_PROVIDERS, required: true },
    txn_ref_no: { type: String, required: true, unique: true, index: true },
    plan_key: { type: String, enum: PLAN_KEYS, required: true },
    amount_paisa: { type: Number, required: true },
    currency: { type: String, default: 'PKR' },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
      index: true,
    },
    response_code: { type: String, default: null },
    response_message: { type: String, default: null },
    raw_request: { type: mongoose.Schema.Types.Mixed, default: null },
    raw_response: { type: mongoose.Schema.Types.Mixed, default: null },
    started_at: { type: Date, default: () => new Date() },
    completed_at: { type: Date, default: null },
    error: { type: String, default: null },
    // Manual JazzCash flow: user submits their TID + sender phone; admin verifies
    // the deposit on the receiving account and approves/rejects.
    sender_phone: { type: String, default: null },
    proof_note: { type: String, default: null },
    verified_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verified_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

paymentSchema.index({ user_id: 1, status: 1, created_at: -1 });

export const Payment = mongoose.model('Payment', paymentSchema, 'payments');
