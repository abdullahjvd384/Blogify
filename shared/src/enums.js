export const USER_ROLES = Object.freeze(['reader', 'writer', 'admin']);
export const USER_STATUSES = Object.freeze(['active', 'banned', 'deleted']);

export const ARTICLE_STATUSES = Object.freeze([
  'draft',
  'submitted',
  'in_review',
  'needs_review',
  'approved',
  'published',
  'rejected',
  'unpublished',
  'removed',
]);

export const MODERATION_VERDICTS = Object.freeze(['approved', 'rejected', 'needs_review']);
export const MODERATION_DECIDERS = Object.freeze(['ai', 'admin']);

export const VOTE_VALUES = Object.freeze([1, -1]);

export const PAYMENT_PROVIDERS = Object.freeze(['jazzcash', 'stripe']);
export const PAYMENT_STATUSES = Object.freeze(['pending', 'success', 'failed', 'refunded']);

export const SUBSCRIPTION_STATUSES = Object.freeze(['active', 'past_due', 'canceled', 'expired']);

export const COMMENT_STATUSES = Object.freeze(['visible', 'deleted']);

export const CONTENT_FORMATS = Object.freeze(['plain', 'html']);

export const UPLOAD_KINDS = Object.freeze(['cover', 'inline', 'avatar']);

export const NOTIFICATION_TYPES = Object.freeze(['follow', 'comment', 'reply', 'upvote']);

export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
});
