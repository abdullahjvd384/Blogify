import { User } from '../models/User.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

/**
 * Restricts a route to one or more user roles. Must be used after `authRequired`.
 * Admin is implicitly allowed everywhere — call sites pass the minimum required role.
 *
 * @param {...('reader'|'writer'|'admin')} allowed
 */
export function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (req.user.role === 'admin' || allowed.includes(req.user.role)) return next();
    next(new ForbiddenError(`Requires role: ${allowed.join(' | ')}`));
  };
}

/**
 * Like `requireRole`, but reads the role + status fresh from the database so a
 * just-demoted/banned user can't keep using a stale JWT to write. One small DB
 * lookup; only use on write endpoints (POST/PATCH/DELETE) where the cost is
 * worth it.
 */
export function requireFreshRole(...allowed) {
  return async (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    try {
      const user = await User.findById(req.user.id, { role: 1, status: 1 }).lean();
      if (!user) return next(new UnauthorizedError('User no longer exists'));
      if (user.status === 'banned') return next(new ForbiddenError('Account is banned'));
      if (user.status === 'deleted') return next(new UnauthorizedError('Account is deleted'));
      if (user.role !== 'admin' && !allowed.includes(user.role)) {
        return next(new ForbiddenError(`Requires role: ${allowed.join(' | ')}`));
      }
      req.user.role = user.role; // keep req.user in sync for downstream handlers
      next();
    } catch (err) {
      next(err);
    }
  };
}
