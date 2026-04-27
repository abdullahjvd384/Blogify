import bcrypt from 'bcrypt';
import { User } from '../../models/User.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '../../utils/errors.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiry,
  signAccessToken,
} from './auth.tokens.js';

const BCRYPT_COST = 12;

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
  const user = await User.create({
    email: input.email,
    password_hash: passwordHash,
    name: input.name,
    timezone: input.timezone || 'Asia/Karachi',
    role: 'reader',
    status: 'active',
  });

  const tokens = await issueTokens(user, ctx);
  return { user, tokens };
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
