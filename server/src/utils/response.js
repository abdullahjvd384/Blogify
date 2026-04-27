/**
 * Response shape helpers. Set on Day 1 — never deviate.
 *
 * - Single resource: { data: ... }
 * - List:           { data: [...], page: { cursor, hasMore } }
 * - Error:          { error: { code, message, details? } }  (handled in error middleware)
 */

export function ok(res, data, status = 200) {
  return res.status(status).json({ data });
}

export function created(res, data) {
  return res.status(201).json({ data });
}

export function noContent(res) {
  return res.status(204).end();
}

export function paginated(res, data, page) {
  return res.status(200).json({ data, page });
}
