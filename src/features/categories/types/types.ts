import type { PaginationParams, PaginationMeta } from '@/src/types';

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  images?: string[];
}

/** GET /categories response shape */
export interface GetCategoriesResponse {
  data: unknown[];
  meta?: PaginationMeta;
}

/** GET /clinics/:clinicId/categories — backend may use `categories` or `data` */
export interface ClinicCategoriesResponse {
  categories?: unknown[];
  data?: unknown[];
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name: string;
  description?: string | undefined;
}

export interface PatchClinicCategoriesPayload {
  action: 'add' | 'remove';
  /** Backend requires a non-empty array — always at least one id, even for a single removal. */
  categoryIds: string[];
}

/** Standard list params: `page`, `limit`, `search`. */
export type GetCategoriesParams = PaginationParams;
