import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { isDevelopment, isProduction } from '../utils/env';

/**
 * Operational Error — Safe to send to client
 * Examples: validation errors, missing resources, auth failures
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Programming Error — Should not reach client
 * Examples: null pointer, type errors, logic bugs
 * Logged for debugging, generic message sent to client
 */
export class ProgrammingError extends Error {
  isOperational = false;

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response structure
 */
interface ErrorResponse {
  error: string;
  code?: string;
  details?: string[] | Record<string, any>;
  requestId?: string;
  timestamp?: string;
  // Only in development
  stack?: string;
}

/**
 * Generate unique request ID for error tracking
 */
function getRequestId(req: Request): string {
  return req.get('x-request-id') || `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log error with appropriate level
 */
function logError(err: Error, requestId: string, isOperational: boolean): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${requestId}] ${err.message}`;

  if (isOperational) {
    // Operational errors — info level
    console.warn(`[OPERATIONAL] ${logMessage}`);
  } else {
    // Programming errors — error level with stack
    console.error(`[ERROR] ${logMessage}`);
    console.error(`[ERROR] Stack: ${err.stack}`);
  }
}

export function notFound(req: Request, res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = getRequestId(req);
  const response: ErrorResponse = {
    error: 'An unexpected error occurred.',
    requestId,
    timestamp: new Date().toISOString(),
  };

  let statusCode = 500;
  let isOperational = false;

  // ─── ZVALIDATION ERRORS ──────────────────────────────────────────────────

  if (err instanceof ZodError) {
    statusCode = 400;
    isOperational = true;
    response.error = 'Request validation failed.';
    response.code = 'VALIDATION_ERROR';
    response.details = err.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    logError(err, requestId, isOperational);
    res.status(statusCode).json(response);
    return;
  }

  // ─── DATABASE ERRORS ─────────────────────────────────────────────────────

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    isOperational = true;
    response.error = 'Database validation failed.';
    response.code = 'DB_VALIDATION_ERROR';
    const anyErr = err as any;
    response.details = anyErr.errors?.map((e: any) => ({
      field: e.path,
      message: e.message,
    })) || [err.message];
    logError(err, requestId, isOperational);
    res.status(statusCode).json(response);
    return;
  }

  // Unique constraint violations
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    isOperational = true;
    response.error = 'A record with this value already exists.';
    response.code = 'DUPLICATE_ERROR';
    const anyErr = err as any;
    response.details = anyErr.errors?.map((e: any) => e.message) || [err.message];
    logError(err, requestId, isOperational);
    res.status(statusCode).json(response);
    return;
  }

  // Generic Sequelize errors
  if (err.name?.startsWith('Sequelize')) {
    statusCode = 500;
    isOperational = false;
    response.error = 'A database error occurred.';
    response.code = 'DB_ERROR';
    logError(err, requestId, isOperational);
    res.status(statusCode).json(response);
    return;
  }

  // ─── OPERATIONAL ERRORS ──────────────────────────────────────────────────

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    isOperational = true;
    response.error = err.message;
    response.code = err.statusCode === 404 ? 'NOT_FOUND' : 'APP_ERROR';
    logError(err, requestId, isOperational);
    res.status(statusCode).json(response);
    return;
  }

  // ─── SPECIFIC ERROR TYPES ────────────────────────────────────────────────

  // File not found errors
  if (err.message?.includes('ENOENT') || err.message?.includes('not found')) {
    statusCode = 404;
    isOperational = true;
    response.error = 'Resource not found.';
    response.code = 'NOT_FOUND';
    logError(err, requestId, isOperational);
    res.status(statusCode).json(response);
    return;
  }

  // Permission/Access errors
  if (
    err.message?.includes('EACCES') ||
    err.message?.includes('EPERM') ||
    err.message?.toLowerCase().includes('permission')
  ) {
    statusCode = 403;
    isOperational = true;
    response.error = 'Permission denied.';
    response.code = 'PERMISSION_DENIED';
    logError(err, requestId, isOperational);
    res.status(statusCode).json(response);
    return;
  }

  // JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    isOperational = true;
    response.error = 'Invalid JSON in request body.';
    response.code = 'INVALID_JSON';
    logError(err, requestId, isOperational);
    res.status(statusCode).json(response);
    return;
  }

  // ─── PROGRAMMING ERRORS (Unknown/Unhandled) ──────────────────────────────

  statusCode = 500;
  isOperational = false;
  response.error = 'An unexpected error occurred. Please try again.';
  response.code = 'INTERNAL_ERROR';

  // In development, expose full error details for debugging
  if (isDevelopment()) {
    response.error = err.message || response.error;
    response.stack = err.stack;
  }

  logError(err, requestId, isOperational);
  res.status(statusCode).json(response);
}
