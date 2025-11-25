/**
 * Global Error Handler
 * Fastify error handler for consistent error responses
 */

import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
// TODO: Uncomment when Sentry is configured
// import * as Sentry from '@sentry/node';

/**
 * Standard error response format
 */
interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code?: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
}

/**
 * HTTP status code to error name mapping
 */
const HTTP_ERRORS: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  413: "Payload Too Large",
  415: "Unsupported Media Type",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    options?: {
      code?: string;
      details?: unknown;
      isOperational?: boolean;
    },
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", details?: unknown) {
    super(message, 404, { code: "NOT_FOUND", details, isOperational: true });
    this.name = "NotFoundError";
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message, 400, {
      code: "VALIDATION_ERROR",
      details,
      isOperational: true,
    });
    this.name = "ValidationError";
  }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required", details?: unknown) {
    super(message, 401, { code: "UNAUTHORIZED", details, isOperational: true });
    this.name = "UnauthorizedError";
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied", details?: unknown) {
    super(message, 403, { code: "FORBIDDEN", details, isOperational: true });
    this.name = "ForbiddenError";
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests", details?: unknown) {
    super(message, 429, {
      code: "RATE_LIMIT_EXCEEDED",
      details,
      isOperational: true,
    });
    this.name = "RateLimitError";
  }
}

/**
 * Database Error
 */
export class DatabaseError extends AppError {
  constructor(message: string = "Database error", details?: unknown) {
    super(message, 500, {
      code: "DATABASE_ERROR",
      details,
      isOperational: false,
    });
    this.name = "DatabaseError";
  }
}

/**
 * External Service Error
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = "External service error",
    details?: unknown,
  ) {
    super(`${service}: ${message}`, 502, {
      code: "EXTERNAL_SERVICE_ERROR",
      details,
      isOperational: false,
    });
    this.name = "ExternalServiceError";
  }
}

/**
 * Global error handler for Fastify
 */
export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  // Generate request ID if not present
  const requestId = request.id || "unknown";

  // Determine if this is an operational error
  const isOperational = error instanceof AppError ? error.isOperational : false;

  // Get status code
  let statusCode = 500;
  if ("statusCode" in error && typeof error.statusCode === "number") {
    statusCode = error.statusCode;
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
  }

  // Get error name
  const errorName = HTTP_ERRORS[statusCode] || "Internal Server Error";

  // Build error response
  const errorResponse: ErrorResponse = {
    statusCode,
    error: errorName,
    message: error.message || "An unexpected error occurred",
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Add error code if available
  if (error instanceof AppError && error.code) {
    errorResponse.code = error.code;
  }

  // Add validation details in development
  if (error instanceof AppError && error.details) {
    errorResponse.details = error.details;
  }

  // Handle Fastify validation errors
  if ("validation" in error && error.validation) {
    errorResponse.statusCode = 400;
    errorResponse.error = "Bad Request";
    errorResponse.code = "VALIDATION_ERROR";
    errorResponse.details = error.validation;
  }

  // Log the error
  if (statusCode >= 500) {
    // Server errors - log as error
    request.log.error(
      {
        err: error,
        requestId,
        path: request.url,
        method: request.method,
        statusCode,
      },
      error.message,
    );

    // Report to Sentry for non-operational errors
    if (!isOperational) {
      // TODO: Uncomment when Sentry is configured
      // Sentry.captureException(error, {
      //   tags: {
      //     requestId,
      //     path: request.url,
      //     method: request.method,
      //   },
      //   extra: {
      //     body: request.body,
      //     query: request.query,
      //     params: request.params,
      //   },
      // });
    }
  } else if (statusCode >= 400) {
    // Client errors - log as warning
    request.log.warn(
      {
        err: error,
        requestId,
        path: request.url,
        method: request.method,
        statusCode,
      },
      error.message,
    );
  }

  // Hide internal error details in production
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && statusCode >= 500 && !isOperational) {
    errorResponse.message =
      "An unexpected error occurred. Please try again later.";
    delete errorResponse.details;
  }

  // Send response
  reply.status(statusCode).send(errorResponse);
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const errorResponse: ErrorResponse = {
    statusCode: 404,
    error: "Not Found",
    message: `Route ${request.method} ${request.url} not found`,
    code: "ROUTE_NOT_FOUND",
    timestamp: new Date().toISOString(),
    requestId: request.id,
  };

  reply.status(404).send(errorResponse);
}
