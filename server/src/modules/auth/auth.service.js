import bcrypt from 'bcrypt';
import { User } from '../../models/User.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import { Subscription } from '../../models/Subscription.js';
import { EmailToken } from '../../models/EmailToken.js';
import { DEFAULT_PLAN, USERNAME_RULES } from '@blogplatform/shared';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { slugify, slugSuffix } from '../../utils/slug.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '../../utils/errors.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiry,
  signAccessToken,
  generateEmailToken,
  hashEmailToken,
} from './auth.tokens.js';
import {
  sendEmail,
  verifyEmailTemplate,
  passwordResetTemplate,
} from '../../services/email.js';

const VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

const BCRYPT_COST = 12;

/**
 * Allocates a unique, URL-safe handle from a display name, e.g. "Jane Doe" → "jane-doe".
 * Leaves room under the 30-char cap for a collision suffix. The unique index is the
 * real guarantee; this only reduces the odds of a create-time collision.
 */
export async function allocateUsername(name) {
  const root = (slugify(name) || 'user').slice(0, 20).replace(/-+$/, '') || 'user';
  const padded = root.length >= USERNAME_RULES.MIN ? root : `${root}-user`.slice(0, 20);
  const candidates = [padded];
  for (let i = 0; i < 5; i++) candidates.push(`${padded}-${slugSuffix()}`.slice(0, USERNAME_RULES.MAX));
  for (const candidate of candidates) {
    if (!(await User.exists({ username: candidate }))) return candidate;
  }
  return `user-${slugSuffix(5)}`;
}

/**
 * Creates a new user (default role: reader) and returns a fresh token pair.
 * Throws ConflictError on duplicate email.
 *
 * @param {{ email: string, password: string, name: string, timezone?: string }} input
 * @param {{ ip?: string, userAgent?: string }} ctx
 */
export async function signup(input, ctx = {}) {
  const exists = await User.findOne({ email: input.email }).lean();
  if (exists) throw new ConflictError('Email already registered');

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  let user;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      user = await User.create({
        email: input.email,
        password_hash: passwordHash,
        name: input.name,
        username: await allocateUsername(input.name),
        timezone: input.timezone || 'Asia/Karachi',
        role: 'writer',
        status: 'active',
      });
      break;
    } catch (err) {
      // Retry only on a username race (email dupe was checked above and is terminal).
      if (err?.code === 11000 && err?.keyPattern?.username) continue;
      throw err;
    }
  }
  if (!user) throw new ConflictError('Could not allocate a unique username, please retry');

  // Subscription is enforced as 1:1 — every user gets a free plan at signup so
  // downstream code (quota middleware, subscriptions/me) can assume one exists.
  await Subscription.create({ user_id: user._id, plan: DEFAULT_PLAN, status: 'active' });

  // Fire-and-forget the verification email so a Resend hiccup doesn't block
  // signup. The user can request a new one via /auth/resend-verification.
  sendVerificationEmail(user).catch((err) =>
    logger.error({ err, userId: user._id.toString() }, 'verification email failed at signup'),
  );

  const tokens = await issueTokens(user, ctx);
  return { user, tokens };
}

/**
 * Generates a fresh verification token, stores its hash, and emails the user a
 * link. Invalidates any older unused verification tokens for this user.
 */
export async function sendVerificationEmail(user) {
  if (user.email_verified_at) return; // already verified
  await EmailToken.deleteMany({ user_id: user._id, type: 'verify_email', used_at: null });
  const { raw, hash } = generateEmailToken();
  await EmailToken.create({
    user_id: user._id,
    type: 'verify_email',
    token_hash: hash,
    expires_at: new Date(Date.now() + VERIFY_EMAIL_TTL_MS),
  });
  const link = `${env.CLIENT_ORIGIN}/verify-email?token=${raw}`;
  const { subject, html } = verifyEmailTemplate({ name: user.name, link });
  await sendEmail({ to: user.email, subject, html });
}

/**
 * Consumes a verification token and marks the user verified. Idempotent — a
 * second call with the same token returns 422 (already used) rather than 500.
 */
export async function verifyEmail(rawToken) {
  if (!rawToken) throw new ValidationError('Missing token');
  const record = await EmailToken.findOne({
    token_hash: hashEmailToken(rawToken),
    type: 'verify_email',
  });
  if (!record) throw new ValidationError('Invalid verification token');
  if (record.used_at) throw new ValidationError('This link has already been used');
  if (record.expires_at.getTime() < Date.now()) {
    throw new ValidationError('Verification link has expired — request a new one');
  }
  const user = await User.findById(record.user_id);
  if (!user) throw new NotFoundError('User not found');

  user.email_verified_at = user.email_verified_at || new Date();
  record.used_at = new Date();
  await Promise.all([user.save(), record.save()]);
  return user;
}

/**
 * Initiates password reset. Always resolves quickly and identically regardless
 * of whether the email exists, to prevent user enumeration. The actual side
 * effect — generating a token and sending an email — only happens for real,
 * active users.
 */
export async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) return; // silent — no user enumeration
  if (user.status !== 'active') return;

  await EmailToken.deleteMany({ user_id: user._id, type: 'password_reset', used_at: null });
  const { raw, hash } = generateEmailToken();
  await EmailToken.create({
    user_id: user._id,
    type: 'password_reset',
    token_hash: hash,
    expires_at: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  });
  const link = `${env.CLIENT_ORIGIN}/reset-password?token=${raw}`;
  const { subject, html } = passwordResetTemplate({ name: user.name, link });
  try {
    await sendEmail({ to: user.email, subject, html });
  } catch (err) {
    logger.error({ err, userId: user._id.toString() }, 'reset email send failed');
    // Still swallow — caller returns 204 anyway.
  }
}

/**
 * Consumes a reset token and sets the new password. Revokes all existing
 * refresh tokens so other sessions get kicked out.
 */
export async function resetPassword(rawToken, newPassword) {
  if (!rawToken) throw new ValidationError('Missing token');
  const record = await EmailToken.findOne({
    token_hash: hashEmailToken(rawToken),
    type: 'password_reset',
  });
  if (!record) throw new ValidationError('Invalid or expired reset token');
  if (record.used_at) throw new ValidationError('This reset link has already been used');
  if (record.expires_at.getTime() < Date.now()) {
    throw new ValidationError('Reset link has expired — start over');
  }
  const user = await User.findById(record.user_id);
  if (!user) throw new NotFoundError('User not found');

  const password_hash = await bcrypt.hash(newPassword, BCRYPT_COST);
  user.password_hash = password_hash;
  record.used_at = new Date();

  await Promise.all([
    user.save(),
    record.save(),
    // Force-logout all sessions so an attacker who saw the old password is locked out.
    RefreshToken.updateMany(
      { user_id: user._id, revoked_at: null },
      { $set: { revoked_at: new Date() } },
    ),
  ]);
  return user;
}

/**
 * Verifies email + password, returns tokens. Generic error to avoid user enumeration.
 */
export async function login(email, password, ctx = {}) {
  const user = await User.findOne({ email });
  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (user.status === 'banned') throw new ForbiddenError('Account banned');
  if (user.status === 'deleted') throw new UnauthorizedError('Invalid email or password');

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) throw new UnauthorizedError('Invalid email or password');

  const tokens = await issueTokens(user, ctx);
  return { user, tokens };
}

/**
 * Validates a raw refresh token, rotates it, and returns a fresh pair.
 * Reuse of a revoked token returns 401 (and we revoke the chain in service v2).
 */
export async function refresh(rawRefreshToken, ctx = {}) {
  if (!rawRefreshToken) throw new UnauthorizedError('Missing refresh token');
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const record = await RefreshToken.findOne({ token_hash: tokenHash });
  if (!record) throw new UnauthorizedError('Invalid refresh token');
  if (record.revoked_at) throw new UnauthorizedError('Refresh token revoked');
  if (record.expires_at.getTime() < Date.now()) {
    throw new UnauthorizedError('Refresh token expired');
  }

  const user = await User.findById(record.user_id);
  if (!user || user.status !== 'active') throw new UnauthorizedError('User not active');

  record.revoked_at = new Date();
  await record.save();

  const tokens = await issueTokens(user, ctx);
  return { user, tokens };
}

export async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return;
  const tokenHash = hashRefreshToken(rawRefreshToken);
  await RefreshToken.updateOne(
    { token_hash: tokenHash, revoked_at: null },
    { $set: { revoked_at: new Date() } },
  );
}

export async function getProfile(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new NotFoundError('User not found');
  return user;
}

/**
 * Updates profile fields the user is allowed to change directly. Role, email,
 * and status are NOT touched here — those go through admin endpoints (or, for
 * email, a separate verify-new-address flow we haven't built yet).
 */
export async function updateProfile(userId, patch) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  if (patch.name !== undefined) user.name = patch.name;
  if (patch.timezone !== undefined) user.timezone = patch.timezone;
  if (patch.bio !== undefined) user.bio = patch.bio;
  if (patch.avatarUrl !== undefined) user.avatar_url = patch.avatarUrl;
  if (patch.username !== undefined) {
    const next = patch.username.toLowerCase();
    if (next !== user.username) {
      const taken = await User.exists({ username: next, _id: { $ne: user._id } });
      if (taken) throw new ConflictError('That username is already taken');
      user.username = next;
    }
  }
  try {
    await user.save();
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.username) {
      throw new ConflictError('That username is already taken');
    }
    throw err;
  }
  return user.toObject();
}

/**
 * Self-service password change. Requires the current password, hashes the new
 * one, and revokes every refresh token so other devices get kicked out.
 */
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  const matches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!matches) throw new UnauthorizedError('Current password is incorrect');
  if (currentPassword === newPassword) {
    throw new ValidationError('New password must be different from the current one');
  }
  user.password_hash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await user.save();
  await RefreshToken.updateMany(
    { user_id: user._id, revoked_at: null },
    { $set: { revoked_at: new Date() } },
  );
  return user.toObject();
}

async function issueTokens(user, ctx) {
  const accessToken = signAccessToken({ id: user._id.toString(), email: user.email, role: user.role });
  const { raw, hash } = generateRefreshToken();
  await RefreshToken.create({
    user_id: user._id,
    token_hash: hash,
    expires_at: refreshExpiry(),
    device_fingerprint: ctx.userAgent || null,
    ip: ctx.ip || null,
  });
  return { accessToken, refreshToken: raw };
}
