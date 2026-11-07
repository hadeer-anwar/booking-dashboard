'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceAssignmentsApi } from '../api/serviceAssignments.api';
import type { ServiceAssignment, GetServiceAssignmentsParams } from '../types/types';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage, hasApiValidationErrors } from '@/src/utils/helpers';
import { memberKeys } from './useStaff';
import type { PaginatedResult } from '@/src/types';
import { EMPTY_PAGINATION_META } from '@/src/types';
import { DEFAULT_PAGE_SIZE } from '@/src/hooks/usePagination';

/* ─── Query key factory ───────────────────────────────────────────────────── */

export const serviceAssignmentKeys = {
  all: ['serviceAssignments'] as const,
  byClinic: (clinicId: string) =>
    [...serviceAssignmentKeys.all, clinicId] as const,
  /** Prefix that matches every variant of a per-service assignment query (any params). */
  byService: (clinicId: string, serviceId: string) =>
    [...serviceAssignmentKeys.byClinic(clinicId), serviceId] as const,
  list: (
    clinicId: string,
    serviceId: string,
    params: GetServiceAssignmentsParams
  ) => [...serviceAssignmentKeys.byService(clinicId, serviceId), params] as const,
  clinicWide: (clinicId: string, params?: GetServiceAssignmentsParams) =>
    [...serviceAssignmentKeys.byClinic(clinicId), 'all', params] as const,
};

/* ─── Options ─────────────────────────────────────────────────────────────── */

interface UseServiceAssignmentsOptions {
  clinicId: string;
  serviceId: string;
  enabled?: boolean;
  /** Free-text search (`?search=`). Backend matches service name + provider firstName + provider email. */
  search?: string;
  /** 1-based page (defaults to 1). */
  page?: number;
  /** Page size (defaults to {@link DEFAULT_PAGE_SIZE}). */
  limit?: number;
}

interface UseServiceAssignmentsReturn {
  assignments: ServiceAssignment[] | null;
  meta: typeof EMPTY_PAGINATION_META;
  loading: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  invalidate: () => Promise<void>;
  refetch: () => Promise<unknown>;
}

/* ─── GET assignments ─────────────────────────────────────────────────────── */

export function useServiceAssignments({
  clinicId,
  serviceId,
  enabled = true,
  search,
  page,
  limit,
}: UseServiceAssignmentsOptions): UseServiceAssignmentsReturn {
  const queryClient = useQueryClient();
  const trimmedSearch = search?.trim() || undefined;
  const params: GetServiceAssignmentsParams = {
    search: trimmedSearch,
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
  };
  const queryKey = serviceAssignmentKeys.list(clinicId, serviceId, params);

  const { data, isFetching, isLoading, error, refetch } = useQuery<
    PaginatedResult<ServiceAssignment>
  >({
    queryKey,
    queryFn: () => serviceAssignmentsApi.getServiceAssignments(clinicId, serviceId, params),
    enabled: Boolean(enabled && clinicId && serviceId),
    staleTime: 0,
    throwOnError: false,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: serviceAssignmentKeys.byService(clinicId, serviceId),
    });
  };

  return {
    assignments: data?.data ?? null,
    meta: data?.meta ?? EMPTY_PAGINATION_META,
    loading: isFetching,
    isLoading,
    isFetching,
    error,
    invalidate,
    refetch,
  };
}

/**
 * GET /clinics/:clinicId/assignments — clinic-wide list with `?page&limit&search`.
 * No UI consumes this yet; exported for future use so the API surface stays
 * consistent with the other paginated lists.
 */
export function useClinicAssignments(
  clinicId: string,
  params?: GetServiceAssignmentsParams
) {
  const trimmedSearch = params?.search?.trim() || undefined;
  const normalized: GetServiceAssignmentsParams = {
    search: trimmedSearch,
    page: params?.page ?? 1,
    limit: params?.limit ?? DEFAULT_PAGE_SIZE,
  };

  const query = useQuery<PaginatedResult<ServiceAssignment>>({
    queryKey: serviceAssignmentKeys.clinicWide(clinicId, normalized),
    queryFn: () => serviceAssignmentsApi.listClinicAssignments(clinicId, normalized),
    enabled: Boolean(clinicId),
  });

  return {
    assignments: query.data?.data ?? [],
    meta: query.data?.meta ?? EMPTY_PAGINATION_META,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/* ─── ASSIGN provider to service ──────────────────────────────────────────── */

export const useAssignProviderToServiceMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({
      clinicId,
      serviceId,
      providerId,
    }: {
      clinicId: string;
      serviceId: string;
      providerId: string;
    }) => serviceAssignmentsApi.assignProviderToService(clinicId, serviceId, providerId),

    onSuccess: (_data, { clinicId, serviceId }) => {
      showSuccess('Provider assigned to this service.', 'Provider assigned');

      queryClient.invalidateQueries({
        queryKey: serviceAssignmentKeys.byService(clinicId, serviceId),
      });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-services', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },

    onError: (err) => {
      showError(
        getApiErrorMessage(err, 'Could not assign provider.'),
        hasApiValidationErrors(err) ? 'Validation failed' : 'Assign failed'
      );
    },
  });

  return {
    assignProvider: mutate,
    assignProviderAsync: mutateAsync,
    isPending,
    error,
  };
};

/* ─── DEACTIVATE assignment (unassign provider from service) ──────────────── */

export const useDeactivateAssignmentMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({
      assignmentId,
    }: {
      assignmentId: string;
      /** Needed only for cache invalidation */
      clinicId: string;
      serviceId: string;
    }) => serviceAssignmentsApi.deactivateAssignment(assignmentId),

    onSuccess: (_data, { clinicId, serviceId }) => {
      showSuccess('Provider removed from this service.', 'Provider removed');

      queryClient.invalidateQueries({
        queryKey: serviceAssignmentKeys.byService(clinicId, serviceId),
      });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-services', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },

    onError: (err) => {
      showError(
        getApiErrorMessage(err, 'Could not remove provider.'),
        hasApiValidationErrors(err) ? 'Validation failed' : 'Remove failed'
      );
    },
  });

  return {
    deactivateAssignment: mutate,
    deactivateAssignmentAsync: mutateAsync,
    isPending,
    error,
  };
};
