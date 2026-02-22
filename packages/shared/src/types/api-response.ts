/**
 * Standard API response types used across the platform.
 * @module types/api-response
 */

/**
 * Base API response wrapper returned by all endpoints.
 * @template T - The type of the response data payload.
 */
export interface ApiResponse<T> {
  /** Indicates whether the request was successful. */
  success: boolean;
  /** The response data payload. */
  data: T;
  /** Optional human-readable message. */
  message?: string;
  /** ISO-8601 timestamp of when the response was generated. */
  timestamp: string;
  /** Unique identifier for the request, useful for tracing. */
  requestId: string;
}

/**
 * Paginated API response for list endpoints.
 * @template T - The type of each item in the results array.
 */
export interface PaginatedApiResponse<T> {
  /** Indicates whether the request was successful. */
  success: boolean;
  /** Array of result items. */
  data: T[];
  /** Pagination metadata. */
  pagination: PaginationMeta;
  /** ISO-8601 timestamp of when the response was generated. */
  timestamp: string;
  /** Unique identifier for the request. */
  requestId: string;
}

/**
 * Metadata describing the current page of results.
 */
export interface PaginationMeta {
  /** Current page number (1-based). */
  page: number;
  /** Number of items per page. */
  perPage: number;
  /** Total number of items across all pages. */
  total: number;
  /** Total number of pages. */
  totalPages: number;
  /** Whether there is a next page. */
  hasNextPage: boolean;
  /** Whether there is a previous page. */
  hasPreviousPage: boolean;
}

/**
 * Response wrapper for batch / bulk operations.
 * @template T - The type of each result item.
 */
export interface BatchApiResponse<T> {
  /** Indicates whether all operations succeeded. */
  success: boolean;
  /** Total number of operations attempted. */
  totalRequested: number;
  /** Number of operations that succeeded. */
  successCount: number;
  /** Number of operations that failed. */
  failureCount: number;
  /** Individual results for each operation. */
  results: BatchResultItem<T>[];
  /** ISO-8601 timestamp. */
  timestamp: string;
}

/**
 * Individual result within a batch response.
 * @template T - The type of the result data.
 */
export interface BatchResultItem<T> {
  /** Index of the item within the original batch request. */
  index: number;
  /** Whether this individual operation succeeded. */
  success: boolean;
  /** The resulting data on success. */
  data?: T;
  /** Error details on failure. */
  error?: string;
}

/**
 * A lightweight response for operations that return no data body.
 */
export interface EmptyApiResponse {
  /** Indicates whether the request was successful. */
  success: boolean;
  /** Optional informational message. */
  message?: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Unique request identifier. */
  requestId: string;
}
