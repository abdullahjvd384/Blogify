import { randomBytes } from 'node:crypto';

/**
 * Slugifies a string: lowercase, ASCII-folded, hyphen-separated, capped at 80 chars.
 * Returns 'untitled' if the input has no usable characters.
 */
export function slugify(input) {
  if (!input) return 'untitled';
  const slug = String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'untitled';
}

/** Short random suffix used to disambiguate colliding slugs. */
export function slugSuffix(bytes = 3) {
  return randomBytes(bytes).toString('hex');
}

/**
 * Yields a unique slug given an `exists(candidate) => boolean` probe.
 * First attempt: bare slug; subsequent attempts: `slug-<rand>`.
 */
export async function uniqueSlug(base, exists, maxAttempts = 5) {
  const root = slugify(base);
  if (!(await exists(root))) return root;
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = `${root}-${slugSuffix()}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error('Could not allocate unique slug');
}
