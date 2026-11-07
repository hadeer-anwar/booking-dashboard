'use client';

import { useQuery } from '@tanstack/react-query';
import type { Clinic } from '../types/types';
import { clinicsApi } from '@/src/features/clinics/api/clinics.api';
import type { PaginatedResult } from '@/src/types';
import { EMPTY_PAGINATION_META } from '@/src/types';
import { DEFAULT_PAGE_SIZE } from '@/src/hooks/usePagination';

export interface UseClinicsOptions {
  enabled?: boolean;
  /** Free-text search forwarded to the backend as `?search=`. */
  search?: string;
  /** 1-based page (defaults to 1). */
  page?: number;
  /** Page size (defaults to {@link DEFAULT_PAGE_SIZE}). */
  limit?: number;
}

/**
 * GET /clinics — paginated list with optional `categoryId` filter and
 * free-text `search`. Returns the current page plus pagination metadata.
 *
 * The first arg `categoryId` is kept for backwards compatibility; new
 * callers can also pass it inside `options`.
 */
export const useClinics = (categoryId?: string, options?: UseClinicsOptions) => {
  const search = options?.search?.trim() || undefined;
  const page = options?.page ?? 1;
  const limit = options?.limit ?? DEFAULT_PAGE_SIZE;

  const query = useQuery<PaginatedResult<Clinic>>({
    queryKey: ['clinics', { isActive: true, categoryId, search, page, limit }],
    queryFn: () =>
      clinicsApi.getClinics({
        isActive: true,
        categoryId,
        search,
        page,
        limit,
      }),
    enabled: options?.enabled !== false,
  });
  return {
    clinics: query.data?.data ?? [],
    meta: query.data?.meta ?? EMPTY_PAGINATION_META,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
