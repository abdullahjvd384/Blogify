import mongoose from 'mongoose';

/** A newsletter email signup. One row per email (unique). */
const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    source: { type: String, default: 'site' },
    status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

export const NewsletterSubscriber = mongoose.model(
  'NewsletterSubscriber',
  newsletterSubscriberSchema,
  'newsletter_subscribers',
);
