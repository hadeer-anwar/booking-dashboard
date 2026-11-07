'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/src/features/categories/api/categories.api';
import { Category, CreateCategoryPayload, UpdateCategoryPayload, PatchClinicCategoriesPayload } from '../types/types';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage } from '@/src/utils/helpers';
import type { PaginatedResult } from '@/src/types';
import { EMPTY_PAGINATION_META } from '@/src/types';
import { DEFAULT_PAGE_SIZE } from '@/src/hooks/usePagination';

export interface UseCategoriesParams {
  /** When set, loads categories linked to this clinic (GET /clinics/:id/categories). */
  clinicId?: string;
  /** Free-text search forwarded to the backend as `?search=`. */
  search?: string;
  /** 1-based page (defaults to 1). */
  page?: number;
  /** Page size (defaults to {@link DEFAULT_PAGE_SIZE}). */
  limit?: number;
}

// ─── Query ────────────────────────────────────────────────────────────────────

export const useCategories = (params?: UseCategoriesParams) => {
  const clinicId = params?.clinicId;
  const search = params?.search?.trim() || undefined;
  const page = params?.page ?? 1;
  const limit = params?.limit ?? DEFAULT_PAGE_SIZE;

  const query = useQuery<PaginatedResult<Category>>({
    queryKey: clinicId
      ? ['categories', 'clinic', clinicId, { search, page, limit }]
      : ['categories', { search, page, limit }],
    queryFn: () =>
      clinicId
        ? categoriesApi.getClinicCategories(clinicId, { search, page, limit })
        : categoriesApi.getCategories({ search, page, limit }),
    enabled: clinicId ? Boolean(clinicId) : true,
  });

  return {
    categories: query.data?.data ?? [],
    meta: query.data?.meta ?? EMPTY_PAGINATION_META,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ─── Create Category ─────────────────────────────────────────────────────────

export const useCreateCategoryMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (payload: CreateCategoryPayload) => categoriesApi.createCategory(payload),
    onSuccess: () => {
      showSuccess('Category created successfully.', 'Category created');
      // The list is paginated server-side now, so we always refetch instead of
      // patching the cache (an optimistic insert could land on the wrong page).
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to create category.'), 'Create failed');
    },
  });

  return { mutate, mutateAsync, isPending, error };
};

// ─── Update Category ─────────────────────────────────────────────────────────

export const useUpdateCategoryMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      categoriesApi.updateCategory(id, payload),
    onSuccess: (updatedCategory, { id }) => {
      showSuccess('Category updated successfully.', 'Changes saved');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.setQueryData<Category>(['category', id], updatedCategory);
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to update category.'), 'Update failed');
    },
  });

  return { mutate, mutateAsync, isPending };
};

// ─── Delete Category ─────────────────────────────────────────────────────────

export const useDeleteCategoryMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: (_, deletedId) => {
      showSuccess('Category deleted successfully.', 'Category removed');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.removeQueries({ queryKey: ['category', deletedId] });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to delete category.'), 'Delete failed');
    },
  });

  return { mutate, mutateAsync, isPending };
};

// ─── Clinic Categories Management ───────────────────────────────────────────

export const useClinicCategoriesMutation = (clinicId: string) => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (payload: PatchClinicCategoriesPayload) =>
      categoriesApi.patchClinicCategories(clinicId, payload),
    onSuccess: (_, payload) => {
      const action = payload.action === 'add' ? 'Added to' : 'Removed from';
      const noun = payload.categoryIds.length > 1 ? 'Categories' : 'Category';
      showSuccess(`${noun} ${action.toLowerCase()} clinic successfully.`, 'Categories updated');

      // Invalidate clinic categories queries
      queryClient.invalidateQueries({ queryKey: ['categories', 'clinic', clinicId] });

      // Also invalidate clinic details as categories might be part of clinic data
      queryClient.invalidateQueries({ queryKey: ['clinic', clinicId] });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to update clinic categories.'), 'Update failed');
    },
  });

  return {
    updateClinicCategories: mutate,
    updateClinicCategoriesAsync: mutateAsync,
    isPending,
    error
  };
};

// ─── Single Category Query ───────────────────────────────────────────────────

// ─── Upload Category Images ───────────────────────────────────────────────────

export const useUploadCategoryImagesMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      categoriesApi.uploadCategoryImages(id, files),
    onSuccess: (_, { id }) => {
      showSuccess('Images uploaded successfully.', 'Photos updated');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to upload images.'), 'Upload failed');
    },
  });

  return { uploadCategoryImages: mutateAsync, isPending };
};