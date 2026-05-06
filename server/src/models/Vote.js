import mongoose from 'mongoose';
import { VOTE_VALUES } from '@blogplatform/shared';

const voteSchema = new mongoose.Schema(
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
    value: { type: Number, enum: VOTE_VALUES, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// One vote per user per article — flipping the vote updates this same row.
voteSchema.index({ user_id: 1, article_id: 1 }, { unique: true });

export const Vote = mongoose.model('Vote', voteSchema, 'votes');
