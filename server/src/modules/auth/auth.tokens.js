import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { TOKEN_TTL } from '@blogplatform/shared';
import { env } from '../../config/env.js';

/**
 * Mints a short-lived access JWT.
 * @param {{ id: string, email: string, role: string }} user
 */
export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: TOKEN_TTL.ACCESS_SECONDS },
  );
}

/**
 * Generates an opaque refresh token (random 64 bytes hex). Returns the raw value
 * (sent in cookie) and its sha256 hash (stored in DB).
 */
export function generateRefreshToken() {
  const raw = randomBytes(64).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashRefreshToken(raw) {
  return createHash('sha256').update(raw).digest('hex');
}

export function refreshExpiry() {
  return new Date(Date.now() + TOKEN_TTL.REFRESH_SECONDS * 1000);
}

/**
 * Generates a single-use email token (verify_email or password_reset).
 * Raw token goes in the email link, hash is stored in DB.
 */
export function generateEmailToken() {
  const raw = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashEmailToken(raw) {
  return createHash('sha256').update(raw).digest('hex');
}
