"use strict";
/**
 * Common API error handling utilities
 * @module @platform/utils/http/api-error
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.handleApiError = handleApiError;
class ApiError extends Error {
    status;
    statusText;
    body;
    constructor(status, statusText, body) {
        super(`API Error ${status}: ${statusText}`);
        this.status = status;
        this.statusText = statusText;
        this.body = body;
        this.name = 'ApiError';
    }
    static fromResponse(status, statusText, body) {
        return new ApiError(status, statusText, body);
    }
    getUserMessage() {
        if (typeof this.body === 'object' && this.body !== null && 'error' in this.body) {
            return String(this.body.error);
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
exports.ApiError = ApiError;
function handleApiError(error) {
    if (error instanceof ApiError) {
        return error.getUserMessage();
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
}
//# sourceMappingURL=api-error.js.map