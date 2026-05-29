import mongoose from 'mongoose';

/** A writer's earning for one finalized payout period. */
const writerEarningSchema = new mongoose.Schema(
  {
    period_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayoutPeriod',
      required: true,
      index: true,
    },
    period_key: { type: String, required: true },
    writer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seconds: { type: Number, default: 0 },
    amount_paisa: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// One earning row per (period, writer); also list a writer's history fast.
writerEarningSchema.index({ period_id: 1, writer_id: 1 }, { unique: true });
writerEarningSchema.index({ writer_id: 1, _id: -1 });

export const WriterEarning = mongoose.model('WriterEarning', writerEarningSchema, 'writer_earnings');
