import { ERROR_CODES } from '@blogplatform/shared';

/**
 * Base operational error. Throw subclasses from services; the central error
 * middleware maps these to JSON responses. Anything that is NOT an AppError
 * is treated as an unknown 500.
 */
export class AppError extends Error {
  /**
   * @param {object} opts
   * @param {string} opts.message
   * @param {number} opts.statusCode
   * @param {string} opts.code
   * @param {object} [opts.details]
   */
  constructor({ message, statusCode, code, details }) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid input', details) {
    super({ message, statusCode: 422, code: ERROR_CODES.VALIDATION_ERROR, details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super({ message, statusCode: 401, code: ERROR_CODES.UNAUTHORIZED });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super({ message, statusCode: 403, code: ERROR_CODES.FORBIDDEN });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super({ message, statusCode: 404, code: ERROR_CODES.NOT_FOUND });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details) {
    super({ message, statusCode: 409, code: ERROR_CODES.CONFLICT, details });
  }
}

export class QuotaExceededError extends AppError {
  constructor(message = 'Daily reading quota exceeded', details) {
    super({ message, statusCode: 402, code: ERROR_CODES.QUOTA_EXCEEDED, details });
  }
}

export class PaymentError extends AppError {
  constructor(message = 'Payment failed', details) {
    super({ message, statusCode: 402, code: ERROR_CODES.PAYMENT_ERROR, details });
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests') {
    super({ message, statusCode: 429, code: ERROR_CODES.RATE_LIMITED });
  }
}
