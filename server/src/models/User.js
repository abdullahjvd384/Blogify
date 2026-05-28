import mongoose from 'mongoose';
import { USER_ROLES, USER_STATUSES } from '@blogplatform/shared';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    email_verified_at: { type: Date, default: null },
    password_hash: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: { type: String, default: null, lowercase: true, trim: true, minlength: 3, maxlength: 30 },
    bio: { type: String, default: '', maxlength: 280 },
    avatar_url: { type: String, default: null },
    followers_count: { type: Number, default: 0 },
    following_count: { type: Number, default: 0 },
    role: { type: String, enum: USER_ROLES, default: 'reader' },
    status: { type: String, enum: USER_STATUSES, default: 'active' },
    timezone: { type: String, default: 'Asia/Karachi' },
    country: { type: String, default: 'PK' },
    reputation_score: { type: Number, default: 0 },
    banned_at: { type: Date, default: null },
    banned_reason: { type: String, default: null },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

userSchema.index({ role: 1, status: 1 });
// Sparse so many nulls coexist until backfill assigns handles; unique once set.
userSchema.index({ username: 1 }, { unique: true, sparse: true });

userSchema.methods.toPublicJSON = function toPublicJSON() {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

export const User = mongoose.model('User', userSchema, 'users');
