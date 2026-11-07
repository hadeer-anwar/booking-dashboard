'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '@/src/features/services/api/services.api';
import type {
  CreateServicePayload,
  UpdateServicePayload,
  Service,
} from '@/src/features/services/types/types';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage } from '@/src/utils/helpers';
import type { PaginatedResult } from '@/src/types';
import { EMPTY_PAGINATION_META } from '@/src/types';
import { DEFAULT_PAGE_SIZE } from '@/src/hooks/usePagination';

interface UseServicesParams {
  clinicId?: string;
  categoryId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface UseClinicServicesParams {
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all] as const,
  list: (params?: UseServicesParams) => [...serviceKeys.lists(), params] as const,
  detail: (id: string) => ['service', id] as const,
  clinicServices: (clinicId: string, params?: UseClinicServicesParams) =>
    ['clinic-services', clinicId, params] as const,
};

// ─── Query Hooks ──────────────────────────────────────────────────────────────

export const useServices = (params?: UseServicesParams) => {
  const search = params?.search?.trim() || undefined;
  const page = params?.page ?? 1;
  const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
  const normalized: UseServicesParams = {
    clinicId: params?.clinicId,
    categoryId: params?.categoryId,
    isActive: params?.isActive,
    search,
    page,
    limit,
  };

  const query = useQuery<PaginatedResult<Service>>({
    queryKey: serviceKeys.list(normalized),
    queryFn: () => servicesApi.getServices(normalized),
  });

  return {
    services: query.data?.data ?? [],
    meta: query.data?.meta ?? EMPTY_PAGINATION_META,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useClinicServices = (
  clinicId: string,
  params?: UseClinicServicesParams
) => {
  const search = params?.search?.trim() || undefined;
  const page = params?.page ?? 1;
  const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
  const isActive = params?.isActive;

  const query = useQuery<PaginatedResult<Service>>({
    queryKey: serviceKeys.clinicServices(clinicId, { search, page, limit, isActive }),
    queryFn: () => servicesApi.getClinicServices(clinicId, { search, page, limit, isActive }),
    enabled: !!clinicId,
  });

  return {
    services: query.data?.data ?? [],
    meta: query.data?.meta ?? EMPTY_PAGINATION_META,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ─── Create Service ───────────────────────────────────────────────────────────

export const useCreateServiceMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (payload: CreateServicePayload) => servicesApi.createService(payload),
    onSuccess: () => {
      showSuccess('Service created successfully.', 'Service created');
      // Lists are paginated server-side; invalidate to refetch the active page.
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['clinic-services'] });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to create service.'), 'Create failed');
    },
  });

  return { createService: mutate, createServiceAsync: mutateAsync, isPending, error };
};

// ─── Update Service ───────────────────────────────────────────────────────────

export const useUpdateServiceMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServicePayload }) =>
      servicesApi.updateService(id, payload),
    onSuccess: (updatedService, { id }) => {
      showSuccess('Service updated successfully.', 'Changes saved');
      queryClient.setQueryData<Service>(serviceKeys.detail(id), updatedService);
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['clinic-services'] });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to update service.'), 'Update failed');
    },
  });

  return { updateService: mutate, updateServiceAsync: mutateAsync, isPending };
};

// ─── Delete Service ───────────────────────────────────────────────────────────

export const useDeleteServiceMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: (_, deletedId) => {
      showSuccess('Service deleted successfully.', 'Service removed');
      queryClient.removeQueries({ queryKey: serviceKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['clinic-services'] });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to delete service.'), 'Delete failed');
    },
  });

  return { deleteService: mutate, deleteServiceAsync: mutateAsync, isPending };
};

// ─── Update Service Status ────────────────────────────────────────────────────

export const useUpdateServiceStatusMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      servicesApi.updateServiceStatus(id, isActive),
    onSuccess: (updatedService, { id, isActive }) => {
      showSuccess(
        isActive ? 'Service is now active.' : 'Service is now inactive.',
        'Status updated'
      );
      queryClient.setQueryData<Service>(serviceKeys.detail(id), updatedService);
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['clinic-services'] });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to update status.'), 'Status update failed');
    },
  });

  return { updateServiceStatus: mutate, updateServiceStatusAsync: mutateAsync, isPending };
};

// ─── Upload Service Images ────────────────────────────────────────────────────

export const useUploadServiceImagesMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      servicesApi.uploadServiceImages(id, files),
    onSuccess: (_, { id }) => {
      showSuccess('Images uploaded successfully.', 'Photos updated');
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['clinic-services'] });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to upload images.'), 'Upload failed');
    },
  });

  return { uploadServiceImages: mutateAsync, isPending };
};
