import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod Validation Errors (checking both instanceof and name for monorepo safety)
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const details = err.errors?.map((e: any) => ({
      field: e.path?.join('.'),
      issue: e.message,
    })) || [];
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The submitted data failed validation requirements',
        details,
      },
    });
    return;
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'resource';
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: `A record with this ${field} already exists.`,
      },
    });
    return;
  }

  // Default Internal Error
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal server error';

  if (env.NODE_ENV !== 'test' && statusCode === 500) {
    console.error('[ServerError]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message,
    },
  });
}
