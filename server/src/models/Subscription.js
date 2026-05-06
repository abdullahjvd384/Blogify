import mongoose from 'mongoose';
import { PLAN_KEYS, SUBSCRIPTION_STATUSES } from '@blogplatform/shared';

/**
 * One Subscription per user (1:1 enforced via unique index on user_id).
 * `current_period_end: null` means never expires — used for the free plan and
 * for grandfathered accounts. Paid plans (Day 11+) will set this to the next
 * renewal date and the daily reconciliation job will flip status when overdue.
 */
const subscriptionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    plan: { type: String, enum: PLAN_KEYS, default: 'free', required: true },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: 'active',
      required: true,
    },
    started_at: { type: Date, default: () => new Date() },
    current_period_end: { type: Date, default: null },
    cancel_at_period_end: { type: Boolean, default: false },
    last_payment_id: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

export const Subscription = mongoose.model(
  'Subscription',
  subscriptionSchema,
  'subscriptions',
);
