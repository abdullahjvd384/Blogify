import mongoose from 'mongoose';
import {
  ARTICLE_STATUSES,
  MODERATION_VERDICTS,
  MODERATION_DECIDERS,
  CONTENT_FORMATS,
} from '@blogplatform/shared';

const moderationSchema = new mongoose.Schema(
  {
    last_verdict: { type: String, enum: MODERATION_VERDICTS, default: null },
    confidence: { type: Number, default: null },
    reasons: { type: [String], default: [] },
    model: { type: String, default: null },
    decided_at: { type: Date, default: null },
    decided_by: { type: String, enum: MODERATION_DECIDERS, default: null },
  },
  { _id: false },
);

const statsSchema = new mongoose.Schema(
  {
    reads: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
  },
  { _id: false },
);

const articleSchema = new mongoose.Schema(
  {
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: '', maxlength: 280 },
    content: { type: String, default: '', maxlength: 200_000 },
    content_format: { type: String, enum: CONTENT_FORMATS, default: 'plain' },
    content_text: { type: String, default: '' },
    cover_image_url: { type: String, default: null },
    tags: { type: [String], default: [], index: true },
    status: { type: String, enum: ARTICLE_STATUSES, default: 'draft', index: true },
    word_count: { type: Number, default: 0 },
    estimated_read_minutes: { type: Number, default: 0 },
    moderation: { type: moderationSchema, default: () => ({}) },
    published_at: { type: Date, default: null, index: true },
    unpublished_at: { type: Date, default: null },
    version: { type: Number, default: 1 },
    stats_snapshot: { type: statsSchema, default: () => ({}) },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

articleSchema.index({ status: 1, published_at: -1 });
articleSchema.index({ author_id: 1, status: 1 });
articleSchema.index({ tags: 1, published_at: -1 });
articleSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

export const Article = mongoose.model('Article', articleSchema, 'articles');
