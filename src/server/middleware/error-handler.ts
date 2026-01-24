/**
 * Error Handling Middleware
 * Catches and formats errors consistently across all endpoints
 */

import type { Context, Next } from 'hono';

interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  stack?: string;
}

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('[Error Handler]', error);

    // Handle different error types
    if (error instanceof Error) {
      const response: ErrorResponse = {
        success: false,
        error: error.name || 'Error',
        message: error.message,
      };

      // Include stack trace in development
      if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
      }

      return c.json(response, 500);
    }

    // Unknown error type
    return c.json({
      success: false,
      error: 'UnknownError',
      message: String(error),
    }, 500);
  }
};

/**
 * Validation error helper
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error helper
 */
export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} '${id}' not found` : `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Permission denied error helper
 */
export class PermissionDeniedError extends Error {
  constructor(message: string = 'Permission denied') {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}
