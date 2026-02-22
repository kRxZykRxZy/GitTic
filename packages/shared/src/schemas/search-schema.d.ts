/**
 * Search schema types for the platform search functionality.
 * @module schemas/search-schema
 */
/**
 * Schema for a global search request.
 */
export interface GlobalSearchSchema {
    /** Search query string. */
    query: string;
    /** Types of resources to include in results. */
    resourceTypes?: SearchResourceType[];
    /** ID of the organization to scope the search to. */
    organizationId?: string;
    /** ID of the project to scope the search to. */
    projectId?: string;
    /** Maximum number of results per resource type. */
    limit?: number;
    /** Whether to include archived resources. */
    includeArchived?: boolean;
}
/**
 * Resource types that can appear in search results.
 */
export type SearchResourceType = "project" | "user" | "organization" | "pipeline" | "deployment" | "environment" | "file" | "issue" | "pull_request" | "commit";
/**
 * A single search result item.
 */
export interface SearchResult {
    /** Type of the resource. */
    resourceType: SearchResourceType;
    /** ID of the resource. */
    resourceId: string;
    /** Title or name of the resource. */
    title: string;
    /** Short description or excerpt with highlights. */
    excerpt: string;
    /** URL to navigate to the resource. */
    url: string;
    /** Relevance score (0-1). */
    score: number;
    /** Highlighted matches within the result. */
    highlights: SearchHighlight[];
    /** ISO-8601 timestamp of the resource's last modification. */
    updatedAt: string;
}
/**
 * A highlighted text match within a search result.
 */
export interface SearchHighlight {
    /** Field in which the match was found. */
    field: string;
    /** Text fragments with <em> tags around matched terms. */
    fragments: string[];
}
/**
 * Response returned from a global search.
 */
export interface SearchResponse {
    /** Search results grouped by resource type. */
    results: SearchResult[];
    /** Total number of results across all types. */
    totalCount: number;
    /** Counts broken down by resource type. */
    facets: SearchFacet[];
    /** Time taken to execute the search in milliseconds. */
    took: number;
    /** The original query string. */
    query: string;
}
/**
 * Facet count for a resource type in search results.
 */
export interface SearchFacet {
    /** Resource type. */
    resourceType: SearchResourceType;
    /** Number of results of this type. */
    count: number;
}
/**
 * Schema for code search requests.
 */
export interface CodeSearchSchema {
    /** Search query string. */
    query: string;
    /** File extension filter (e.g., "ts", "js"). */
    extension?: string;
    /** Path prefix filter. */
    pathPrefix?: string;
    /** ID of the project to search within. */
    projectId: string;
    /** Git ref to search (branch, tag, or commit SHA). */
    ref?: string;
    /** Whether to use regex matching. */
    isRegex?: boolean;
    /** Whether the search is case-sensitive. */
    caseSensitive?: boolean;
    /** Page number. */
    page?: number;
    /** Items per page. */
    perPage?: number;
}
/**
 * A code search result item.
 */
export interface CodeSearchResult {
    /** File path relative to the repository root. */
    filePath: string;
    /** Programming language of the file. */
    language: string;
    /** Matching lines with context. */
    matches: CodeSearchMatch[];
    /** Relevance score. */
    score: number;
}
/**
 * A matching line in a code search result.
 */
export interface CodeSearchMatch {
    /** Line number (1-based). */
    lineNumber: number;
    /** Content of the matching line. */
    lineContent: string;
    /** Character offsets of the match within the line [start, end]. */
    matchOffsets: [number, number];
}
//# sourceMappingURL=search-schema.d.ts.map