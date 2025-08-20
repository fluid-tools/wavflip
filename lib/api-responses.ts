import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from './logger';

/**
 * Standard API response schemas and utilities
 * Ensures consistent error handling and response formats across all API routes
 */

// Standard error codes
export const API_ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Operations
  OPERATION_FAILED: 'OPERATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// Standard response schemas
export const apiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown().optional(),
  meta: z.record(z.unknown()).optional(),
});

export const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string(),
  details: z.unknown().optional(),
  meta: z.record(z.unknown()).optional(),
});

export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data?: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  code: ApiErrorCode;
  details?: unknown;
  meta?: Record<string, unknown>;
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create standardized API responses
 */
export class ApiResponses {
  static success<T>(data?: T, meta?: Record<string, unknown>): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = { success: true };
    if (data !== undefined) response.data = data;
    if (meta) response.meta = meta;
    
    return NextResponse.json(response);
  }

  static error(
    message: string,
    code: ApiErrorCode,
    status: number,
    details?: unknown,
    meta?: Record<string, unknown>
  ): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error: message,
      code,
    };
    
    if (details !== undefined) response.details = details;
    if (meta) response.meta = meta;
    
    return NextResponse.json(response, { status });
  }

  // Common error responses
  static unauthorized(message = 'Authentication required'): NextResponse<ApiErrorResponse> {
    return this.error(message, API_ERROR_CODES.UNAUTHORIZED, 401);
  }

  static forbidden(message = 'Access denied'): NextResponse<ApiErrorResponse> {
    return this.error(message, API_ERROR_CODES.FORBIDDEN, 403);
  }

  static notFound(message = 'Resource not found'): NextResponse<ApiErrorResponse> {
    return this.error(message, API_ERROR_CODES.NOT_FOUND, 404);
  }

  static badRequest(message = 'Invalid request', details?: unknown): NextResponse<ApiErrorResponse> {
    return this.error(message, API_ERROR_CODES.INVALID_INPUT, 400, details);
  }

  static validationError(message = 'Validation failed', errors: unknown): NextResponse<ApiErrorResponse> {
    return this.error(message, API_ERROR_CODES.VALIDATION_FAILED, 400, errors);
  }

  static conflict(message = 'Resource conflict'): NextResponse<ApiErrorResponse> {
    return this.error(message, API_ERROR_CODES.RESOURCE_CONFLICT, 409);
  }

  static rateLimit(message = 'Rate limit exceeded'): NextResponse<ApiErrorResponse> {
    return this.error(message, API_ERROR_CODES.RATE_LIMITED, 429);
  }

  static internalError(message = 'Internal server error'): NextResponse<ApiErrorResponse> {
    return this.error(message, API_ERROR_CODES.INTERNAL_ERROR, 500);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable'): NextResponse<ApiErrorResponse> {
    return this.error(message, API_ERROR_CODES.SERVICE_UNAVAILABLE, 503);
  }
}

/**
 * Safely handle and log API errors
 */
export function handleApiError(
  error: unknown,
  operation: string,
  context?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  // Extract error details
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const isOperationalError = error instanceof Error && 
    (error.message.includes('not found') || 
     error.message.includes('forbidden') || 
     error.message.includes('unauthorized'));

  // Log error with context
  logger.error(`API operation failed: ${operation}`, context, error as Error);

  // Return appropriate response based on error type
  if (isOperationalError) {
    if (errorMessage.toLowerCase().includes('not found')) {
      return ApiResponses.notFound(errorMessage);
    }
    if (errorMessage.toLowerCase().includes('forbidden')) {
      return ApiResponses.forbidden(errorMessage);
    }
    if (errorMessage.toLowerCase().includes('unauthorized')) {
      return ApiResponses.unauthorized(errorMessage);
    }
  }

  // For unexpected errors, return generic message to avoid information leakage
  return ApiResponses.internalError('An unexpected error occurred');
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse<ApiErrorResponse> }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return {
        success: false,
        response: ApiResponses.validationError(
          'Request validation failed',
          result.error.errors
        ),
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      response: ApiResponses.badRequest('Invalid JSON in request body'),
    };
  }
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T>(
  text: string,
  fallback: T
): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}