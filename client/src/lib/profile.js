/** Canonical profile URL for an author/user object. Prefers the @username handle. */
export function profilePath(user) {
  if (!user) return '/';
  return `/u/${user.username || user.id}`;
}

/** Two-letter initials from a name/email, for avatar fallbacks. */
export function initialsFor(nameOrEmail = '') {
  const parts = String(nameOrEmail).split(/[\s@.]+/).filter(Boolean);
  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return initials.toUpperCase() || String(nameOrEmail)[0]?.toUpperCase() || 'A';
}
