import jwt from 'jsonwebtoken';
import { COOKIE_NAMES } from '@blogplatform/shared';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Pulls and verifies the access token from cookies (preferred) or Authorization
 * header (fallback for tools/tests). On success: req.user = { id, role, email }.
 * Throws UnauthorizedError on missing/invalid/expired token.
 */
function readAndVerifyAccessToken(req) {
  const cookieToken = req.cookies?.[COOKIE_NAMES.ACCESS];
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || headerToken;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return { id: payload.sub, role: payload.role, email: payload.email };
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export function authRequired(req, _res, next) {
  const user = readAndVerifyAccessToken(req);
  if (!user) return next(new UnauthorizedError());
  req.user = user;
  next();
}

export function authOptional(req, _res, next) {
  try {
    const user = readAndVerifyAccessToken(req);
    if (user) req.user = user;
  } catch {
    // optional → swallow; treat as anonymous
  }
  next();
}
