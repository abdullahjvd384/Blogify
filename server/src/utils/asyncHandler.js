/**
 * Wraps an async route handler so thrown errors are forwarded to Express
 * `next()` and caught by the central error middleware. Avoids try/catch noise
 * in every controller.
 *
 * @template {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => any} T
 * @param {T} fn
 * @returns {T}
 */
export function asyncHandler(fn) {
  return ((req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  });
}
