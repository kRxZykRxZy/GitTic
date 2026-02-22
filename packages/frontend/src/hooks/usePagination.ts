import { useState, useCallback, useMemo } from "react";

/** Pagination state and controls */
export interface UsePaginationResult {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPerPage: (perPage: number) => void;
  setTotal: (total: number) => void;
}

/** Options for usePagination hook */
export interface UsePaginationOptions {
  initialPage?: number;
  initialPerPage?: number;
  initialTotal?: number;
}

/**
 * Hook for managing client-side pagination state.
 *
 * Provides page navigation, per-page selection, and computed values
 * like totalPages, hasNext, hasPrev, startIndex, endIndex.
 */
export function usePagination(
  options: UsePaginationOptions = {},
): UsePaginationResult {
  const {
    initialPage = 1,
    initialPerPage = 25,
    initialTotal = 0,
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [perPage, setPerPageState] = useState(initialPerPage);
  const [total, setTotalState] = useState(initialTotal);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / perPage)),
    [total, perPage],
  );

  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const startIndex = (page - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, total);

  const goToPage = useCallback(
    (newPage: number) => {
      const clamped = Math.max(1, Math.min(newPage, totalPages));
      setPageState(clamped);
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    if (hasNext) {
      setPageState((prev) => prev + 1);
    }
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) {
      setPageState((prev) => prev - 1);
    }
  }, [hasPrev]);

  const setPerPage = useCallback((newPerPage: number) => {
    setPerPageState(newPerPage);
    setPageState(1);
  }, []);

  const setTotal = useCallback(
    (newTotal: number) => {
      setTotalState(newTotal);
      const newTotalPages = Math.max(1, Math.ceil(newTotal / perPage));
      if (page > newTotalPages) {
        setPageState(newTotalPages);
      }
    },
    [page, perPage],
  );

  return {
    page,
    perPage,
    total,
    totalPages,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    setPerPage,
    setTotal,
  };
}
