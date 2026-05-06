import mongoose from 'mongoose';
import { MODERATION_VERDICTS, MODERATION_DECIDERS } from '@blogplatform/shared';

const JOB_STATUSES = ['queued', 'running', 'succeeded', 'failed'];

/**
 * Audit row per moderation attempt. One Article can have many ModerationJobs
 * across resubmissions / retries. We keep the raw model response so we can
 * audit verdicts later without re-querying GROQ.
 */
const moderationJobSchema = new mongoose.Schema(
  {
    article_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
    status: { type: String, enum: JOB_STATUSES, default: 'queued', index: true },
    queue_job_id: { type: String, default: null },
    attempt: { type: Number, default: 1 },

    verdict: { type: String, enum: MODERATION_VERDICTS, default: null },
    confidence: { type: Number, default: null },
    reasons: { type: [String], default: [] },
    suggested_tags: { type: [String], default: [] },
    decided_by: { type: String, enum: MODERATION_DECIDERS, default: 'ai' },

    model: { type: String, default: null },
    raw_response: { type: mongoose.Schema.Types.Mixed, default: null },
    error: { type: String, default: null },

    started_at: { type: Date, default: null },
    finished_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

export const ModerationJob = mongoose.model(
  'ModerationJob',
  moderationJobSchema,
  'moderation_jobs',
);
