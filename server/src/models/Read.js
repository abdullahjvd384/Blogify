import mongoose from 'mongoose';

/**
 * One row per completed read session (a writer-facing analytics fact).
 * `watched_seconds` is server-computed from capped heartbeat deltas — the
 * client never sets it directly. `fraud_score` accumulates whenever the
 * server detected something fishy (impossible deltas, missing-start
 * heartbeats, exceeding the per-article cap).
 *
 * Index priorities:
 *   - { article_id, ended_at } — writer dashboards (per-article reads over time)
 *   - { user_id, ended_at }    — reader history (Phase 2)
 */
const readSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    article_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
    started_at: { type: Date, required: true },
    ended_at: { type: Date, required: true },
    watched_seconds: { type: Number, required: true, default: 0 },
    completed: { type: Boolean, default: false },
    // Whether the reader was an active member at read time — drives payout eligibility.
    reader_was_member: { type: Boolean, default: false },
    fraud_score: { type: Number, default: 0 },
    ip: { type: String, default: null },
    user_agent: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

readSchema.index({ article_id: 1, ended_at: -1 });
readSchema.index({ user_id: 1, ended_at: -1 });

export const Read = mongoose.model('Read', readSchema, 'reads');
