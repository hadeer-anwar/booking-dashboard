'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clinicStaffApi } from '../api/clinicStaff.api';
import type {
  ClinicStaffMember,
  CreateClinicStaffPayload,
  UpdateClinicStaffPayload,
  UpdateClinicStaffSchedulePayload,
  GetClinicStaffParams,
  ClinicStaffListResponse,
} from '../types/types';
import type { ClinicSchedule } from '@/src/features/schedule/types/types';
import { hasApiValidationErrors, getApiErrorMessage } from '@/src/utils/helpers';
import { useToast } from '@/src/components/ui/ToastProvider';
import { EMPTY_PAGINATION_META } from '@/src/types';
import { DEFAULT_PAGE_SIZE } from '@/src/hooks/usePagination';

/* ─── Query key factory ───────────────────────────────────────────────────── */

export const memberKeys = {
  all: ['clinic-staff'] as const,
  member: (clinicId: string, userId: string) =>
    ['member', clinicId, userId] as const,
  schedule: (clinicId: string, userId: string) =>
    ['member-schedule', clinicId, userId] as const,
  staffList: (clinicId: string, params?: GetClinicStaffParams) =>
    ['clinic-staff', clinicId, params] as const,
};

/* ─────────────── Helper to normalize schedule ───────────────────────────── */

function normalizeSchedule(schedule?: ClinicSchedule): ClinicSchedule {
  return {
    workingDays: schedule?.workingDays ?? [],
  };
}

/* ─────────────── GET ALL STAFF ──────────────────────────────────────────── */

export const useClinicStaff = (clinicId: string, params?: GetClinicStaffParams) => {
  const search = params?.search?.trim() || undefined;
  const page = params?.page ?? 1;
  const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
  const normalized: GetClinicStaffParams = { search, page, limit };

  const { data, isLoading, isFetching, error, refetch } = useQuery<ClinicStaffListResponse>({
    queryKey: memberKeys.staffList(clinicId, normalized),
    queryFn: () => clinicStaffApi.getClinicStaff(clinicId, normalized),
    enabled: !!clinicId,
  });

  return {
    staff: data ?? { providers: [], clinicAdmin: [], moderators: [], meta: EMPTY_PAGINATION_META },
    providers: data?.providers ?? [],
    clinicAdmin: data?.clinicAdmin ?? [],
    moderators: data?.moderators ?? [],
    meta: data?.meta ?? EMPTY_PAGINATION_META,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

/* ─────────────── GET SINGLE MEMBER ──────────────────────────────────────── */

export const useMember = (clinicId: string, userId: string) => {
  const { data, isLoading, error, refetch } = useQuery<ClinicStaffMember>({
    queryKey: memberKeys.member(clinicId, userId),
    queryFn: () => clinicStaffApi.getClinicStaffById(clinicId, userId),
    enabled: !!clinicId && !!userId,
  });

  return { 
    member: data ?? null, 
    isLoading, 
    error, 
    refetch 
  };
};

/* ─────────────── GET MEMBER SCHEDULE ────────────────────────────────────── */

export const useMemberSchedule = (clinicId: string, userId: string) => {
  const { data, isLoading, error, refetch } = useQuery<ClinicSchedule>({
    queryKey: memberKeys.schedule(clinicId, userId),
    queryFn: () => clinicStaffApi.getProviderSchedule(clinicId, userId),
    enabled: !!clinicId && !!userId,
  });

  return { 
    schedule: data ? normalizeSchedule(data) : { workingDays: [] },
    isLoading, 
    error, 
    refetch 
  };
};

/* ─────────────── CREATE STAFF MEMBER ────────────────────────────────────── */

export const useCreateStaffMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ clinicId, payload }: { clinicId: string; payload: CreateClinicStaffPayload }) =>
      clinicStaffApi.createClinicStaff(clinicId, payload),

    onSuccess: (_data, { clinicId }) => {
      showSuccess('Staff member added successfully.', 'Staff created');
      queryClient.invalidateQueries({ queryKey: memberKeys.staffList(clinicId) });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },

    onError: (err) => {
      showError(
        getApiErrorMessage(err, 'Could not add staff member.'),
        hasApiValidationErrors(err) ? 'Validation failed' : 'Create failed'
      );
    },
  });

  return { createStaff: mutate, createStaffAsync: mutateAsync, isPending, error };
};

/* ─────────────── UPDATE STATUS ──────────────────────────────────────────── */

export const useMemberStatusMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ clinicId, userId, isActive }: { clinicId: string; userId: string; isActive: boolean }) =>
      clinicStaffApi.updateStaffStatus(clinicId, userId, { isActive }),

    onSuccess: (_data, { clinicId, userId, isActive }) => {
      showSuccess(`Staff member ${isActive ? 'activated' : 'deactivated'} successfully.`, 'Status updated');
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: memberKeys.member(clinicId, userId) });
      queryClient.invalidateQueries({ queryKey: memberKeys.staffList(clinicId) });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      
      // Update cache immediately
      queryClient.setQueryData<ClinicStaffMember>(
        memberKeys.member(clinicId, userId),
        (old) => {
          if (!old) return old;
          return { ...old, isActive };
        }
      );
    },

    onError: (err) => {
      showError(
        getApiErrorMessage(err, 'Could not update status.'),
        hasApiValidationErrors(err) ? 'Validation failed' : 'Update failed'
      );
    },
  });

  return { updateStatus: mutate, updateStatusAsync: mutateAsync, isPending, error };
};

/* ─────────────── UPDATE PROFILE ─────────────────────────────────────────── */

export const useMemberProfileMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ clinicId, userId, payload }: { clinicId: string; userId: string; payload: UpdateClinicStaffPayload }) =>
      clinicStaffApi.updateClinicStaff(clinicId, userId, payload),

    onSuccess: (_data, { clinicId, userId, payload }) => {
      showSuccess('Profile updated successfully.', 'Profile saved');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: memberKeys.member(clinicId, userId) });
      queryClient.invalidateQueries({ queryKey: memberKeys.staffList(clinicId) });
      
      // Update cache immediately with optimistic update
      queryClient.setQueryData<ClinicStaffMember>(
        memberKeys.member(clinicId, userId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            ...payload,
            fullName: payload.firstName || payload.lastName 
              ? `${payload.firstName || old.firstName} ${payload.lastName || old.lastName}`.trim()
              : old.fullName,
          };
        }
      );
    },

    onError: (err) => {
      showError(
        getApiErrorMessage(err, 'Could not update profile.'),
        hasApiValidationErrors(err) ? 'Validation failed' : 'Update failed'
      );
    },
  });

  return { updateProfile: mutate, updateProfileAsync: mutateAsync, isPending, error };
};

/* ─────────────── UPDATE FULL SCHEDULE ───────────────────────────────────── */

export const useUpdateScheduleMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ clinicId, providerId, payload }: { clinicId: string; providerId: string; payload: UpdateClinicStaffSchedulePayload }) =>
      clinicStaffApi.updateStaffSchedule(clinicId, providerId, payload).then(() => undefined),

    onSuccess: (_data, { clinicId, providerId }) => {
      showSuccess('Schedule updated successfully.', 'Schedule saved');

      // Refetch from server so the cache always holds the read shape
      // ({ start, end } strings) — never the write shape ({ startMinutes,
      // endMinutes }) we just sent in the payload.
      queryClient.invalidateQueries({ queryKey: memberKeys.schedule(clinicId, providerId) });
      queryClient.invalidateQueries({ queryKey: memberKeys.member(clinicId, providerId) });
      queryClient.invalidateQueries({ queryKey: memberKeys.staffList(clinicId) });
    },

    onError: (err) => {
      showError(
        getApiErrorMessage(err, 'Failed to update schedule.'),
        'Update failed'
      );
    },
  });

  return { updateSchedule: mutate, updateScheduleAsync: mutateAsync, isPending, error };
};

/* ─────────────── UPDATE SINGLE DAY SCHEDULE ─────────────────────────────── */

export const useUpdateDayScheduleMutation = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ clinicId, providerId, payload }: { clinicId: string; providerId: string; payload: UpdateClinicStaffSchedulePayload }) =>
      clinicStaffApi.updateStaffSchedule(clinicId, providerId, payload).then(() => undefined),

    onSuccess: (_data, { clinicId, providerId }) => {
      showSuccess('Day schedule saved.', 'Schedule updated');

      // Refetch from server so the cache always holds the read shape
      // ({ start, end } strings) instead of the write payload shape.
      queryClient.invalidateQueries({ queryKey: memberKeys.schedule(clinicId, providerId) });
      queryClient.invalidateQueries({ queryKey: memberKeys.member(clinicId, providerId) });
    },

    onError: (err) => {
      showError(
        getApiErrorMessage(err, 'Unable to save schedule.'),
        'Save failed'
      );
    },
  });

  return { updateDaySchedule: mutate, updateDayScheduleAsync: mutateAsync, isPending, error };
};