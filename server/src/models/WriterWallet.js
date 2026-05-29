import mongoose from 'mongoose';

/**
 * A writer's money balance, all in paisa.
 * - available: withdrawable now.
 * - pending: reserved against an in-flight withdrawal request.
 * - lifetime: total ever earned (never decremented) — a vanity/audit figure.
 */
const writerWalletSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    available_paisa: { type: Number, default: 0 },
    pending_paisa: { type: Number, default: 0 },
    lifetime_paisa: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

export const WriterWallet = mongoose.model('WriterWallet', writerWalletSchema, 'writer_wallets');
