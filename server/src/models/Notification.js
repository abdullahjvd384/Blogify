import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '@blogplatform/shared';

const notificationSchema = new mongoose.Schema(
  {
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    article_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
    comment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    read_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// Newest-first listing per recipient + fast unread filtering.
notificationSchema.index({ recipient_id: 1, _id: -1 });
notificationSchema.index({ recipient_id: 1, read_at: 1 });

export const Notification = mongoose.model('Notification', notificationSchema, 'notifications');
