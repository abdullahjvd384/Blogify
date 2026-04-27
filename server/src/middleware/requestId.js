import { randomUUID } from 'node:crypto';

/**
 * Attaches a stable request ID for log correlation.
 * Honors an inbound `X-Request-Id` header (e.g., from a CDN) when present.
 */
export function requestId(req, res, next) {
  const inbound = req.headers['x-request-id'];
  req.id = typeof inbound === 'string' && inbound.length > 0 ? inbound : randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}
