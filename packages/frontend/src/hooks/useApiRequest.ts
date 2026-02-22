/**
 * Custom React hooks for API interactions
 * @module @platform/frontend/hooks/useApiRequest
 */

import { useState, useCallback } from 'react';
import { ApiError } from '../services/api-client';

function handleApiError(error: unknown): string {
    if (error instanceof ApiError) {
        if (typeof error.body === 'object' && error.body !== null && 'error' in error.body) {
            const body = error.body as { error?: unknown };
            if (typeof body.error === 'string') {
                return body.error;
            }
        }
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'An unexpected error occurred';
}

interface UseApiRequestOptions<T = unknown> {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
}

export function useApiRequest<T = unknown>(options: UseApiRequestOptions<T> = {}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<T | null>(null);

    const execute = useCallback(
        async (
            url: string,
            init?: RequestInit,
        ): Promise<T | null> => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('token');
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                    ...(init?.headers || {}),
                };

                const response = await fetch(url, {
                    ...init,
                    headers,
                });

                if (!response.ok) {
                    let errorBody: unknown;
                    try {
                        errorBody = await response.json();
                    } catch {
                        errorBody = await response.text().catch(() => null);
                    }
                    throw new ApiError(response.status, response.statusText, errorBody);
                }

                const responseData = await response.json();
                setData(responseData);
                options.onSuccess?.(responseData);
                return responseData;
            } catch (err) {
                const errorMessage = handleApiError(err);
                setError(errorMessage);
                options.onError?.(errorMessage);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [options],
    );

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setData(null);
    }, []);

    return {
        loading,
        error,
        data,
        execute,
        reset,
    };
}

export default useApiRequest;
