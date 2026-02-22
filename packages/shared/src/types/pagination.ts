/**
 * Pagination-related types for list endpoints and data queries.
 * @module types/pagination
 */

/**
 * Parameters supplied by the client to request a specific page.
 */
export interface PaginationParams {
  /** Page number to retrieve (1-based). */
  page: number;
  /** Maximum number of items per page. */
  perPage: number;
}

/**
 * Cursor-based pagination parameters, used for real-time feeds.
 */
export interface CursorPaginationParams {
  /** Opaque cursor pointing to the start of the next page. */
  cursor?: string;
  /** Maximum number of items to return after the cursor. */
  limit: number;
  /** Direction of traversal relative to the cursor. */
  direction: CursorDirection;
}

/**
 * Direction for cursor-based pagination.
 */
export type CursorDirection = "forward" | "backward";

/**
 * Metadata returned alongside a cursor-paginated response.
 */
export interface CursorPaginationMeta {
  /** Cursor pointing to the first item in the current page. */
  startCursor: string | null;
  /** Cursor pointing to the last item in the current page. */
  endCursor: string | null;
  /** Whether more items exist after the end cursor. */
  hasNextPage: boolean;
  /** Whether more items exist before the start cursor. */
  hasPreviousPage: boolean;
}

/**
 * Offset-based pagination parameters using skip/take semantics.
 */
export interface OffsetPaginationParams {
  /** Number of items to skip before starting to return results. */
  offset: number;
  /** Maximum number of items to return. */
  limit: number;
}

/**
 * A generic paginated result container.
 * @template T - The type of each item in the result set.
 */
export interface PaginatedResult<T> {
  /** The items on the current page. */
  items: T[];
  /** Total count of items matching the query. */
  totalCount: number;
  /** Current page number (1-based), when using page-based pagination. */
  currentPage: number;
  /** Total number of pages available. */
  totalPages: number;
  /** Whether a next page exists. */
  hasMore: boolean;
}

/**
 * A cursor-paginated result container.
 * @template T - The type of each item in the result set.
 */
export interface CursorPaginatedResult<T> {
  /** Edges wrapping each node with its cursor. */
  edges: CursorEdge<T>[];
  /** Pagination metadata. */
  pageInfo: CursorPaginationMeta;
  /** Total count of items matching the query. */
  totalCount: number;
}

/**
 * An edge in a cursor-paginated result, pairing a node with its cursor.
 * @template T - The type of the node.
 */
export interface CursorEdge<T> {
  /** The actual data item. */
  node: T;
  /** Opaque cursor for this item. */
  cursor: string;
}
