import { toCamel } from './case.js';

/**
 * Converts a Mongoose lean doc (or POJO) into the API response shape:
 *   - replaces _id (ObjectId) with id (hex string)
 *   - drops fields in `omit`
 *   - camelCases all keys
 *
 * @param {object|null|undefined} doc
 * @param {{ omit?: string[] }} [opts]
 */
export function present(doc, { omit = [] } = {}) {
  if (!doc) return doc;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  for (const key of omit) delete obj[key];
  return toCamel(obj);
}

export function presentMany(docs, opts) {
  return (docs || []).map((d) => present(d, opts));
}
