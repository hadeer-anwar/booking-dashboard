'use client';

import { useEffect, useState } from 'react';

/** Default page size used by every paginated list across the app. */
export const DEFAULT_PAGE_SIZE = 15;

interface UsePaginationOptions {
  /** Initial page size. Defaults to {@link DEFAULT_PAGE_SIZE}. */
  initialLimit?: number;
  /**
   * Whenever this value changes, the page is reset to 1. Pass the debounced
   * search string (or any filter value) so a new search starts at page 1
   * instead of the user's previous page (which might no longer exist).
   */
  resetKey?: unknown;
}

interface UsePaginationReturn {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

/**
 * Tiny pagination state holder. Owns `page` + `limit` and resets `page`
 * back to 1 whenever `resetKey` changes — so flipping a filter or running
 * a new search doesn't strand the user on an out-of-range page.
 *
 * Example:
 *   const debouncedSearch = useDebouncedValue(search, 350);
 *   const { page, limit, setPage } = usePagination({ resetKey: debouncedSearch });
 *   const { data } = useQuery({
 *     queryKey: ['things', { page, limit, search: debouncedSearch }],
 *     queryFn: () => api.list({ page, limit, search: debouncedSearch }),
 *   });
 */
export function usePagination(options?: UsePaginationOptions): UsePaginationReturn {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(options?.initialLimit ?? DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [options?.resetKey]);

  return { page, limit, setPage, setLimit };
}
