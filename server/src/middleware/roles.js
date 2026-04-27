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
