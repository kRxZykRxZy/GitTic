import { api } from "./api-client";
import {
  ApiResponse,
  PaginatedResponse,
  Project,
  SearchResult,
} from "../types/api";

/** Search type filter */
export type SearchType = "all" | "repos" | "code" | "users";

/** Parameters for search queries */
export interface SearchParams {
  query: string;
  type?: SearchType;
  page?: number;
  perPage?: number;
  sort?: "relevance" | "stars" | "updated";
  order?: "asc" | "desc";
}

/**
 * Perform a search query with optional type filtering.
 */
export async function search(
  params: SearchParams,
): Promise<ApiResponse<PaginatedResponse<SearchResult>>> {
  return api.get<PaginatedResponse<SearchResult>>("/search", {
    params: {
      q: params.query,
      type: params.type,
      page: params.page,
      perPage: params.perPage,
      sort: params.sort,
      order: params.order,
    },
  });
}

/**
 * Fetch trending projects.
 */
export async function getTrending(
  language?: string,
  range?: "daily" | "weekly" | "monthly",
): Promise<ApiResponse<Project[]>> {
  return api.get<Project[]>("/search/trending", {
    params: {
      language,
      range,
    },
  });
}

/** Search service namespace */
export const searchService = {
  search,
  getTrending,
} as const;
