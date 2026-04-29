/**
 * Reads a friendly error message out of an axios error. Falls back to the
 * generic axios message; returns "Something went wrong" if everything is empty.
 */
export function readApiError(err) {
  const data = err?.response?.data;
  if (data?.error?.message) return data.error.message;
  if (typeof data === 'string' && data) return data;
  return err?.message || 'Something went wrong';
}
