/**
 * Boundary mapping helpers. DB uses snake_case; JS uses camelCase.
 * Apply at the controller boundary so internal code stays idiomatic.
 *
 * Intentionally narrow: handles plain objects, arrays, primitives, and Date.
 * Does NOT recurse into Buffer, Map, Set, Mongoose documents (call `.toObject()` first).
 */
const camelToSnake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function isLeaf(value) {
  if (value === null || typeof value !== 'object') return true;
  if (value instanceof Date) return true;
  if (Buffer.isBuffer(value)) return true;
  if (value._bsontype === 'ObjectId') return true;
  return false;
}

function mapKeys(value, transform) {
  if (Array.isArray(value)) return value.map((v) => mapKeys(v, transform));
  if (isLeaf(value)) {
    if (value && value._bsontype === 'ObjectId') return value.toString();
    return value;
  }
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[transform(k)] = mapKeys(v, transform);
  }
  return out;
}

export const toCamel = (value) => mapKeys(value, snakeToCamel);
export const toSnake = (value) => mapKeys(value, camelToSnake);
