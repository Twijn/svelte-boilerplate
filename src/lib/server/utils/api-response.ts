/**
 * Standardized API response utilities
 * Provides consistent response formats across all API endpoints
 */

export interface ApiSuccessResponse<T = unknown> {
	success: true;
	data: T;
	message?: string;
}

export interface ApiErrorResponse {
	success: false;
	error: string;
	code?: string;
	details?: Record<string, string>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a standardized success response
 * @param data - The data to return
 * @param message - Optional success message
 * @returns Standardized success response object
 */
export function apiSuccess<T>(data: T, message?: string): ApiSuccessResponse<T> {
	return {
		success: true,
		data,
		...(message && { message })
	};
}

/**
 * Create a standardized error response
 * @param error - Error message
 * @param code - Optional error code for client-side handling
 * @param details - Optional field-specific error details
 * @returns Standardized error response object
 */
export function apiError(
	error: string,
	code?: string,
	details?: Record<string, string>
): ApiErrorResponse {
	return {
		success: false,
		error,
		...(code && { code }),
		...(details && { details })
	};
}

/**
 * Common error codes for consistent error handling
 */
export const ErrorCodes = {
	// Authentication & Authorization
	UNAUTHORIZED: 'UNAUTHORIZED',
	FORBIDDEN: 'FORBIDDEN',
	INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
	SESSION_EXPIRED: 'SESSION_EXPIRED',
	ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
	ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
	EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
	TWO_FACTOR_REQUIRED: 'TWO_FACTOR_REQUIRED',

	// Validation
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	INVALID_INPUT: 'INVALID_INPUT',
	MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

	// Rate Limiting
	RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

	// Resources
	NOT_FOUND: 'NOT_FOUND',
	ALREADY_EXISTS: 'ALREADY_EXISTS',
	CONFLICT: 'CONFLICT',

	// Server
	INTERNAL_ERROR: 'INTERNAL_ERROR',
	DATABASE_ERROR: 'DATABASE_ERROR',
	EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',

	// Operations
	OPERATION_FAILED: 'OPERATION_FAILED',
	INVALID_OPERATION: 'INVALID_OPERATION'
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
