/**
 * Common API error handling utilities
 * @module @platform/utils/http/api-error
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }

  static fromResponse(status: number, statusText: string, body: unknown): ApiError {
    return new ApiError(status, statusText, body);
  }

  getUserMessage(): string {
    if (typeof this.body === 'object' && this.body !== null && 'error' in this.body) {
      return String((this.body as any).error);
    }
    
    switch (this.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'You must be logged in to perform this action.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 500:
        return 'An internal server error occurred. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.getUserMessage();
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
