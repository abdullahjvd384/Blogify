import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
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
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// One save per user per article.
bookmarkSchema.index({ user_id: 1, article_id: 1 }, { unique: true });
// Cursor-paged "my saved articles".
bookmarkSchema.index({ user_id: 1, _id: -1 });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema, 'bookmarks');
