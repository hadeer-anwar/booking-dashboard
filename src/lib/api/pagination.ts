import type { PaginationMeta, PaginationParams } from '@/src/types';

export function buildListQuery(
  params?: PaginationParams,
  extras?: Record<string, string | number | boolean | undefined>
): Record<string, string | number | boolean> | undefined {
  const q: Record<string, string | number | boolean> = {};

  if (params?.page && params.page > 0) q.page = params.page;
  if (params?.limit && params.limit > 0) q.limit = params.limit;
  const search = params?.search?.trim();
  if (search) q.search = search;

  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      if (value !== undefined && value !== '') {
        q[key] = value;
      }
    }
  }

  return Object.keys(q).length ? q : undefined;
}

export function extractPaginationMeta(
  payload: unknown,
  fallback?: { page?: number; limit?: number; resultCount?: number }
): PaginationMeta {
  const root = (payload ?? {}) as Record<string, unknown>;
  const meta =
    (root.meta as Record<string, unknown> | undefined) ??
    (root.pagination as Record<string, unknown> | undefined) ??
    root;

  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;

  const limit = num(meta.limit) ?? fallback?.limit ?? 15;
  const total = num(meta.total) ?? fallback?.resultCount ?? 0;
  const page = num(meta.page) ?? fallback?.page ?? 1;
  const totalPages =
    num(meta.totalPages) ??
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return { page, limit, total, totalPages };
}
