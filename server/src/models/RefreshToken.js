import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token_hash: { type: String, required: true, unique: true },
    device_fingerprint: { type: String, default: null },
    ip: { type: String, default: null },
    expires_at: { type: Date, required: true },
    revoked_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  },
);

refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model(
  'RefreshToken',
  refreshTokenSchema,
  'refresh_tokens',
);
