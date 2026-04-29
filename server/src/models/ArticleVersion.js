import mongoose from 'mongoose';

const articleVersionSchema = new mongoose.Schema(
  {
    article_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
    version: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    edited_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    edited_at: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
);

articleVersionSchema.index({ article_id: 1, version: -1 });

export const ArticleVersion = mongoose.model(
  'ArticleVersion',
  articleVersionSchema,
  'article_versions',
);
