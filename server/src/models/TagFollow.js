import mongoose from 'mongoose';

const tagFollowSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tag: { type: String, required: true, lowercase: true, trim: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// One follow per (user, tag); list a user's followed tags newest-first.
tagFollowSchema.index({ user_id: 1, tag: 1 }, { unique: true });
tagFollowSchema.index({ user_id: 1, _id: -1 });
tagFollowSchema.index({ tag: 1 });

export const TagFollow = mongoose.model('TagFollow', tagFollowSchema, 'tag_follows');
