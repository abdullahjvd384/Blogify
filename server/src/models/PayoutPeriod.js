import mongoose from 'mongoose';
import { PAYOUT_PERIOD_STATUSES } from '@blogplatform/shared';

/**
 * One row per payout month (period_key = YYYY-MM in the platform timezone).
 * Finalizing snapshots the revenue, pool, and total member reading-seconds used
 * to split the pool, so earnings are reproducible and auditable.
 */
const payoutPeriodSchema = new mongoose.Schema(
  {
    period_key: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: PAYOUT_PERIOD_STATUSES, default: 'open' },
    member_revenue_paisa: { type: Number, default: 0 },
    payout_percent: { type: Number, default: 0 },
    pool_paisa: { type: Number, default: 0 },
    total_seconds: { type: Number, default: 0 },
    writer_count: { type: Number, default: 0 },
    finalized_at: { type: Date, default: null },
    finalized_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

export const PayoutPeriod = mongoose.model('PayoutPeriod', payoutPeriodSchema, 'payout_periods');
