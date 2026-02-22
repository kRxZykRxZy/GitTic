/**
 * Common API error handling utilities
 * @module @platform/utils/http/api-error
 */
export declare class ApiError extends Error {
    readonly status: number;
    readonly statusText: string;
    readonly body: unknown;
    constructor(status: number, statusText: string, body: unknown);
    static fromResponse(status: number, statusText: string, body: unknown): ApiError;
    getUserMessage(): string;
}
export declare function handleApiError(error: unknown): string;
//# sourceMappingURL=api-error.d.ts.map