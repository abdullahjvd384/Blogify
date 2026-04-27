import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ERROR_CODES } from '@blogplatform/shared';
import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { isProd } from '../config/env.js';

/**
 * Central Express error handler. Must be registered last.
 *
 * Mapping:
 * - AppError       → use its statusCode/code/message/details
 * - ZodError       → 422 VALIDATION_ERROR with field issues
 * - Mongoose CastError / ValidationError → 400
 * - Mongoose duplicate key (E11000) → 409 CONFLICT
 * - Anything else  → 500 INTERNAL (no stack leak in prod)
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const requestId = req.id;

  if (err instanceof AppError) {
    logger.warn(
      { requestId, code: err.code, statusCode: err.statusCode, details: err.details },
      err.message,
    );
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err instanceof ZodError) {
    logger.warn({ requestId, issues: err.issues }, 'validation error');
    return res.status(422).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid input',
        details: { issues: err.issues },
      },
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid input',
        details: { fields: err.errors },
      },
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: `Invalid value for ${err.path}` },
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      error: {
        code: ERROR_CODES.CONFLICT,
        message: 'Resource already exists',
        details: { keyValue: err.keyValue },
      },
    });
  }

  logger.error({ err, requestId }, 'unhandled error');
  return res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL,
      message: isProd ? 'Internal server error' : err.message,
      ...(isProd ? {} : { details: { stack: err.stack } }),
    },
  });
}
