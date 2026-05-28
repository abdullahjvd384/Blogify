import mongoose from 'mongoose';
import { COMMENT_STATUSES, COMMENT_LIMITS } from '@blogplatform/shared';

const commentSchema = new mongoose.Schema(
  {
    article_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // null for a top-level comment; set to a top-level comment id for a reply.
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    body: { type: String, required: true, trim: true, maxlength: COMMENT_LIMITS.MAX_BODY },
    status: { type: String, enum: COMMENT_STATUSES, default: 'visible' },
    replies_count: { type: Number, default: 0 },
    edited_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// Top-level list (parent_id null) and replies (parent_id set), cursor-paged.
commentSchema.index({ article_id: 1, parent_id: 1, _id: -1 });

export const Comment = mongoose.model('Comment', commentSchema, 'comments');
