import { api } from '@/src/lib/api/axios';
import { appendImageFiles } from '@/src/lib/api/media';
import { buildListQuery, extractPaginationMeta } from '@/src/lib/api/pagination';
import type { PaginatedResult } from '@/src/types';
import type {
  Category,
  GetCategoriesResponse,
  ClinicCategoriesResponse,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  PatchClinicCategoriesPayload,
  GetCategoriesParams,
} from '../types/types';
import { normalizeCategory } from './categoryNormalize';

export const categoriesApi = {
  getCategories: async (
    params?: GetCategoriesParams
  ): Promise<PaginatedResult<Category>> => {
    const response = await api.get<GetCategoriesResponse>('/categories', {
      params: buildListQuery(params),
    });
    const list = response.data?.data ?? [];
    const data = Array.isArray(list) ? list.map(normalizeCategory) : [];
    const meta = extractPaginationMeta(response.data, {
      page: params?.page,
      limit: params?.limit,
      resultCount: data.length,
    });
    return { data, meta };
  },

  /** GET /clinics/:clinicId/categories — categories linked to a clinic */
  getClinicCategories: async (
    clinicId: string,
    params?: GetCategoriesParams
  ): Promise<PaginatedResult<Category>> => {
    const response = await api.get<ClinicCategoriesResponse>(
      `/clinics/${clinicId}/categories`,
      { params: buildListQuery(params) }
    );
    const body = response.data;
    const list = body?.categories ?? body?.data ?? [];
    const data = Array.isArray(list) ? list.map(normalizeCategory) : [];
    const meta = extractPaginationMeta(body, {
      page: params?.page,
      limit: params?.limit,
      resultCount: data.length,
    });
    return { data, meta };
  },

  /** PATCH /clinics/:clinicId/categories — body: { action: "add" | "remove", categoryIds } */
  patchClinicCategories: async (
    clinicId: string,
    payload: PatchClinicCategoriesPayload
  ): Promise<void> => {
    await api.patch(`/clinics/${clinicId}/categories`, payload);
  },

  createCategory: async (payload: CreateCategoryPayload): Promise<Category> => {
    const response = await api.post<unknown>('/categories', {
      name: payload.name,
      description: payload.description,
    });
    return normalizeCategory(response.data);
  },

  updateCategory: async (id: string, payload: UpdateCategoryPayload): Promise<Category> => {
    const response = await api.patch<unknown>(`/categories/${id}`, {
      name: payload.name,
      description: payload.description,
    });
    return normalizeCategory(response.data);
  },

  /** Upload / replace category photos. PUT /categories/:categoryId/images (multipart/form-data) */
  uploadCategoryImages: async (categoryId: string, files: File[]): Promise<void> => {
    const fd = new FormData();
    appendImageFiles(fd, files);
    await api.put(`/categories/${categoryId}/images`, fd);
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};