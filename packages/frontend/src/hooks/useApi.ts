import { useState, useEffect, useCallback, useRef } from "react";
import { ApiResponse, PaginatedResponse } from "../types/api";

/** State for a generic API call */
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Return type of useApi hook */
interface UseApiResult<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

/**
 * Generic data fetching hook. Calls the provided fetcher on mount and
 * exposes loading, error, data, and refetch.
 *
 * @param fetcher - Async function that returns an ApiResponse
 * @param deps - Dependency array to trigger re-fetching
 * @param immediate - Whether to fetch immediately on mount (default: true)
 */
export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: unknown[] = [],
  immediate = true,
): UseApiResult<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetcher();
      if (mountedRef.current) {
        if (response.success) {
          setState({ data: response.data, loading: false, error: null });
        } else {
          setState({
            data: null,
            loading: false,
            error: response.message || "Request failed",
          });
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setState({ data: null, loading: false, error: message });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      fetchData();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData, immediate]);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchData,
    setData,
  };
}

/** Return type of usePaginatedApi hook */
interface UsePaginatedApiResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  goToPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  refetch: () => Promise<void>;
}

/**
 * Hook for paginated API calls.
 *
 * @param fetcher - Function that accepts page & perPage and returns a paginated response
 * @param initialPerPage - Initial items per page
 */
export function usePaginatedApi<T>(
  fetcher: (
    page: number,
    perPage: number,
  ) => Promise<ApiResponse<PaginatedResponse<T>>>,
  initialPerPage = 25,
): UsePaginatedApiResult<T> {
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(initialPerPage);

  const result = useApi<PaginatedResponse<T>>(
    () => fetcher(page, perPage),
    [page, perPage],
  );

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1) {
        setPage(newPage);
      }
    },
    [],
  );

  const setPerPage = useCallback((newPerPage: number) => {
    setPerPageState(newPerPage);
    setPage(1);
  }, []);

  return {
    items: result.data?.items ?? [],
    loading: result.loading,
    error: result.error,
    page: result.data?.page ?? page,
    perPage: result.data?.perPage ?? perPage,
    total: result.data?.total ?? 0,
    totalPages: result.data?.totalPages ?? 0,
    hasNext: result.data?.hasNext ?? false,
    hasPrev: result.data?.hasPrev ?? false,
    goToPage,
    setPerPage,
    refetch: result.refetch,
  };
}
