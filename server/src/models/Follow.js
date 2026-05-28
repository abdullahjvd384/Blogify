import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
  {
    follower_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    following_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// One follow edge per (follower, following) pair.
followSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });
// Cursor-paged "followers of X" and "who X follows" / following-feed author lookup.
followSchema.index({ following_id: 1, _id: -1 });
followSchema.index({ follower_id: 1, _id: -1 });

export const Follow = mongoose.model('Follow', followSchema, 'follows');
