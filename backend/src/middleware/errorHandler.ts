import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom error classes for better error handling
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(409, message);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message, false);
  }
}

/**
 * Error handling middleware
 * Should be used as the last middleware in Express app
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Check if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Default error status and message
  let statusCode = 500;
  let message = 'Internal server error';
  let errors = undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Prisma validation errors
  else if ((err as any).code === 'P2002') {
    statusCode = 409;
    message = 'This resource already exists';
  } else if ((err as any).code === 'P2025') {
    statusCode = 404;
    message = 'Resource not found';
  } else if ((err as any).code?.startsWith('P')) {
    statusCode = 400;
    message = 'Database error occurred';
  }
  // Handle Joi validation errors
  else if ((err as any).isJoi) {
    statusCode = 400;
    message = 'Validation error';
    errors = (err as any).details?.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
  }
  // Handle JSON parse errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    logger.error('Request failed', err, {
      statusCode,
      message,
      originalError: err instanceof AppError ? undefined : err.message,
    });
  }

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(errors && { errors }),
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found middleware
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(
    `Cannot find ${req.originalUrl} on this server!`,
  );
  next(error);
};

/**
 * Request validation middleware factory
 */
export const validate = (schema: any, property: string = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate((req as any)[property]);
    if (error) {
      const validationError = new ValidationError(
        error.details?.map((d: any) => d.message).join(', ') || 'Validation failed',
      );
      return next(validationError);
    }
    (req as any)[property] = value;
    next();
  };
};

/**
 * Error wrapper for async route handlers using try-catch pattern
 */
export const tryCatch = (fn: Function) => {
  return (...args: any[]) => {
    Promise.resolve(fn(...args)).catch(args[args.length - 1]);
  };
};
