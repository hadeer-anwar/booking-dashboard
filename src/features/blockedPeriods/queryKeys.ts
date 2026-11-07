import type { GetBlockedPeriodsParams } from './types/types';

/**
 * `list(...)` and `detail(...)` both nest under `all(clinicId)`, so
 * invalidating `all` correctly cascades to every cached list/detail for that
 * clinic via React Query's prefix matching — unlike a couple of the
 * pre-existing per-feature key factories elsewhere in this codebase, where a
 * `.all` key doesn't share a prefix with some of its own sibling keys.
 */
export const blockedPeriodKeys = {
  all: (clinicId: string) => ['blocked-periods', clinicId] as const,
  list: (clinicId: string, params?: GetBlockedPeriodsParams) =>
    ['blocked-periods', clinicId, 'list', params] as const,
  detail: (clinicId: string, blockedPeriodId: string) =>
    ['blocked-periods', clinicId, 'detail', blockedPeriodId] as const,
};
