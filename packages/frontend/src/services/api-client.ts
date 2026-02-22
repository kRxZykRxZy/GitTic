import { ApiResponse } from "../types/api";
import { API_BASE_URL, STORAGE_KEYS } from "../utils/constants";

/** HTTP methods supported by the client */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Request options for the API client */
interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

/** API error with status code and response body */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

/**
 * Build a query string from a params object, filtering out undefined values.
 */
function buildQueryString(
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined,
  ) as [string, string | number | boolean][];
  if (entries.length === 0) return "";
  const qs = entries
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");
  return `?${qs}`;
}

/**
 * Retrieve the stored access token.
 */
function getAccessToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

/**
 * Core fetch wrapper with auth token injection and error handling.
 */
async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}${buildQueryString(options.params)}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal: options.signal,
  };

  if (body !== undefined && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text().catch(() => null);
    }
    throw new ApiError(response.status, response.statusText, errorBody);
  }

  const data = await response.json();
  
  // Wrap response if it's not already in ApiResponse format
  if (data && typeof data === 'object' && 'success' in data) {
    return data as ApiResponse<T>;
  }
  
  // Backend returns unwrapped data, so wrap it
  return {
    success: true,
    data: data as T,
    timestamp: new Date().toISOString()
  };
}

/** API client singleton with typed HTTP methods */
export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>("POST", path, body, options);
  },

  put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>("PUT", path, body, options);
  },

  patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>("PATCH", path, body, options);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("DELETE", path, undefined, options);
  },
} as const;
