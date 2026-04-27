/**
 * Runs a Zod schema against a chosen part of the request and stores the parsed
 * result on `req.valid[where]`. Throws ZodError on failure (caught by central
 * error handler).
 *
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body' | 'query' | 'params'} [where='body']
 */
export function validate(schema, where = 'body') {
  return (req, _res, next) => {
    const parsed = schema.parse(req[where]);
    req.valid = req.valid || {};
    req.valid[where] = parsed;
    next();
  };
}
