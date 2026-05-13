import mongoose from 'mongoose';

const TYPES = ['verify_email', 'password_reset'];

const emailTokenSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TYPES, required: true },
    token_hash: { type: String, required: true, unique: true },
    expires_at: { type: Date, required: true },
    used_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  },
);

// Mongo TTL: expired rows are auto-deleted by the cluster.
emailTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
emailTokenSchema.index({ user_id: 1, type: 1 });

export const EmailToken = mongoose.model('EmailToken', emailTokenSchema, 'email_tokens');
export const EMAIL_TOKEN_TYPES = TYPES;
