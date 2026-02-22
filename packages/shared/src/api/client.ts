/**
 * Shared API client configuration and utilities
 * @module @platform/shared/api/client
 */

export const API_BASE_URL = '/api/v1';

export interface ApiRequestInit extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Get authorization header with JWT token
 */
export function getAuthHeader(): HeadersInit {
  const token = typeof window !== 'undefined' && window.localStorage
    ? window.localStorage.getItem('token') 
    : null;
  
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Build full API URL
 */
export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

/**
 * Create standardized API fetch request
 */
export async function apiRequest<T = any>(
  url: string,
  init: ApiRequestInit = {}
): Promise<T> {
  const { skipAuth, ...fetchInit } = init;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(skipAuth ? {} : getAuthHeader()),
    ...(init.headers || {}),
  };

  const response = await fetch(buildApiUrl(url), {
    ...fetchInit,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Standardized API methods
 */
export const api = {
  get: <T = any>(url: string, init?: ApiRequestInit) =>
    apiRequest<T>(url, { ...init, method: 'GET' }),
    
  post: <T = any>(url: string, body?: unknown, init?: ApiRequestInit) =>
    apiRequest<T>(url, {
      ...init,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  put: <T = any>(url: string, body?: unknown, init?: ApiRequestInit) =>
    apiRequest<T>(url, {
      ...init,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  patch: <T = any>(url: string, body?: unknown, init?: ApiRequestInit) =>
    apiRequest<T>(url, {
      ...init,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  delete: <T = any>(url: string, init?: ApiRequestInit) =>
    apiRequest<T>(url, { ...init, method: 'DELETE' }),
};
