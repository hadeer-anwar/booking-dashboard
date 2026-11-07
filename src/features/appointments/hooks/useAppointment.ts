'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../api/appointments.api';
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentPayload,
  CancelAppointmentPayload,
  AssignProviderPayload,
} from '../types/types';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage, hasApiValidationErrors } from '@/src/utils/helpers';
import type { PaginatedResult } from '@/src/types';
import { EMPTY_PAGINATION_META } from '@/src/types';
import { DEFAULT_PAGE_SIZE } from '@/src/hooks/usePagination';

export const APPOINTMENTS_QUERY_KEY = 'appointments';
export const AVAILABLE_SLOTS_QUERY_KEY = 'available-slots';

// ─── useAppointments ──────────────────────────────────────────────────────────

interface UseAppointmentsParams {
  status?: AppointmentStatus;
  /** Server-side `?search=` (customer firstName / email / phoneNumber). */
  search?: string;
  page?: number;
  limit?: number;
  /** Filter appointments on or after this date (YYYY-MM-DD). */
  from?: string;
  /** Filter appointments on or before this date (YYYY-MM-DD). */
  to?: string;
}

/**
 * Lists appointments for a clinic. Accepts a status filter, free-text search,
 * and standard pagination — all forwarded to the backend.
 *
 * @example
 *   useAppointments(clinicId, { status: 'pending', search, page, limit });
 *
 * The legacy positional signature `useAppointments(clinicId, status, search)`
 * is still supported for backwards compatibility.
 */
export function useAppointments(
  clinicId: string,
  paramsOrStatus?: UseAppointmentsParams | AppointmentStatus,
  legacySearch?: string
) {
  const params: UseAppointmentsParams =
    typeof paramsOrStatus === 'string' || paramsOrStatus === undefined
      ? { status: paramsOrStatus, search: legacySearch }
      : paramsOrStatus;

  const trimmedSearch = params.search?.trim() || undefined;
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_PAGE_SIZE;
  const from = params.from || undefined;
  const to = params.to || undefined;

  const query = useQuery<PaginatedResult<Appointment>>({
    queryKey: [
      APPOINTMENTS_QUERY_KEY,
      clinicId,
      params.status,
      { search: trimmedSearch, page, limit, from, to },
    ],
    queryFn: () =>
      appointmentsApi.getClinicAppointments(clinicId, {
        status: params.status,
        search: trimmedSearch,
        page,
        limit,
        from,
        to,
      }),
    enabled: !!clinicId,
  });

  return {
    appointments: query.data?.data ?? [],
    meta: query.data?.meta ?? EMPTY_PAGINATION_META,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// ─── useAppointmentById ───────────────────────────────────────────────────────

export const useAppointmentById = (id: string | null) => {
  const query = useQuery({
    queryKey: [APPOINTMENTS_QUERY_KEY, 'detail', id],
    queryFn: () => appointmentsApi.getAppointmentById(id!),
    enabled: !!id,
  });

  return {
    appointment: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

// ─── useAvailableProvidersForAppointment ──────────────────────────────────────

/**
 * Lists providers eligible to be assigned to a specific pending_assignment
 * appointment (working hours / blocks / conflicts already filtered
 * server-side). Only fires when `appointmentId` is provided — pass null/''
 * until the assign modal is actually open for a target appointment.
 */
export const useAvailableProvidersForAppointment = (appointmentId: string | null) => {
  const query = useQuery({
    queryKey: [APPOINTMENTS_QUERY_KEY, 'available-providers', appointmentId],
    queryFn: () => appointmentsApi.getAvailableProviders(appointmentId!),
    enabled: !!appointmentId,
  });

  return {
    providers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ─── useAvailableSlots ────────────────────────────────────────────────────────

/**
 * Fetches available time slots for a given clinic + service + date combo.
 * Only fires when all three are provided.
 */
export const useAvailableSlots = (
  clinicId: string,
  serviceId: string,
  date: string
) => {
  const query = useQuery({
    queryKey: [AVAILABLE_SLOTS_QUERY_KEY, clinicId, serviceId, date],
    queryFn: () => appointmentsApi.getAvailableSlots(clinicId, serviceId, { date }),
    enabled: !!(clinicId && serviceId && date),
    staleTime: 60_000, // 1 minute — slots don't change very often
  });

  return {
    slots: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ─── useAppointmentActions ────────────────────────────────────────────────────

/**
 * Patches every cached `useAppointments(clinicId, …)` list — across all
 * status filters — by replacing the matching row with `next`.
 */
function patchListsWithAppointment(
  queryClient: ReturnType<typeof useQueryClient>,
  clinicId: string,
  next: Appointment
) {
  queryClient.setQueriesData<{
    data: Appointment[];
    meta?: { page: number; limit: number; total: number; totalPages: number };
  }>(
    { queryKey: [APPOINTMENTS_QUERY_KEY, clinicId] },
    (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        data: prev.data.map((a) => (a.id === next.id ? { ...a, ...next } : a)),
      };
    }
  );
}

export const useAppointmentActions = (clinicId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const invalidateAll = () => {
    // Invalidate every appointment list for this clinic (any status filter)
    // and any cached detail queries.
    queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY, clinicId] });
    queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY, 'detail'] });
    // Slot availability changes when appointments are created/cancelled.
    queryClient.invalidateQueries({ queryKey: [AVAILABLE_SLOTS_QUERY_KEY] });
  };

  const handleStatusSuccess = (appointment: Appointment, message: string, title: string) => {
    showSuccess(message, title);

    // Optimistically patch every cached list so the row updates instantly,
    // then invalidate so the source of truth is refetched.
    patchListsWithAppointment(queryClient, clinicId, appointment);
    queryClient.setQueryData<Appointment>(
      [APPOINTMENTS_QUERY_KEY, 'detail', appointment.id],
      appointment
    );
    invalidateAll();
  };

  const handleError = (err: unknown, fallback: string, defaultTitle: string) => {
    showError(
      getApiErrorMessage(err, fallback),
      hasApiValidationErrors(err) ? 'Validation failed' : defaultTitle
    );
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateAppointmentPayload) =>
      appointmentsApi.createAppointment(clinicId, payload),
    onSuccess: () => {
      showSuccess('Appointment created successfully.', 'Appointment booked');
      invalidateAll();
    },
    onError: (err: unknown) =>
      handleError(err, 'Failed to create appointment.', 'Create failed'),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.confirmAppointment(id),
    onSuccess: (appointment) =>
      handleStatusSuccess(appointment, 'Appointment confirmed.', 'Confirmed'),
    onError: (err: unknown) =>
      handleError(err, 'Failed to confirm appointment.', 'Confirm failed'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.completeAppointment(id),
    onSuccess: (appointment) =>
      handleStatusSuccess(appointment, 'Appointment marked as completed.', 'Completed'),
    onError: (err: unknown) =>
      handleError(err, 'Failed to complete appointment.', 'Complete failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CancelAppointmentPayload;
    }) => appointmentsApi.cancelAppointment(id, payload),
    onSuccess: (appointment) =>
      handleStatusSuccess(appointment, 'Appointment cancelled.', 'Cancelled'),
    onError: (err: unknown) =>
      handleError(err, 'Failed to cancel appointment.', 'Cancel failed'),
  });

  const assignProviderMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AssignProviderPayload;
    }) => appointmentsApi.assignProvider(id, payload),
    onSuccess: (appointment) =>
      handleStatusSuccess(appointment, 'Provider assigned.', 'Provider assigned'),
    onError: (err: unknown) =>
      handleError(err, 'Failed to assign provider.', 'Assign failed'),
  });

  return {
    createAppointment: createMutation.mutateAsync,
    confirmAppointment: confirmMutation.mutateAsync,
    completeAppointment: completeMutation.mutateAsync,
    cancelAppointment: cancelMutation.mutateAsync,
    assignProvider: assignProviderMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isConfirming: confirmMutation.isPending,
    isCompleting: completeMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isAssigning: assignProviderMutation.isPending,
  };
};