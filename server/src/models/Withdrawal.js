import mongoose from 'mongoose';
import { WITHDRAWAL_STATUSES } from '@blogplatform/shared';

/**
 * A writer's cash-out request. On request we reserve the amount (wallet
 * available → pending). Admin pays out-of-band via JazzCash then marks paid
 * (pending → cleared), or rejects (pending → available).
 */
const withdrawalSchema = new mongoose.Schema(
  {
    writer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount_paisa: { type: Number, required: true },
    method: { type: String, default: 'jazzcash' },
    account_number: { type: String, required: true },
    status: { type: String, enum: WITHDRAWAL_STATUSES, default: 'requested', index: true },
    note: { type: String, default: null },
    processed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processed_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

withdrawalSchema.index({ writer_id: 1, _id: -1 });

export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema, 'withdrawals');
