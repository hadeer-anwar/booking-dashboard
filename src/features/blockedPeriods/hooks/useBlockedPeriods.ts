'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { blockedPeriodsApi } from '../api/blockedPeriods.api';
import { blockedPeriodKeys } from '../queryKeys';
import type {
  BlockedPeriodConflictsPayload,
  CreateBlockedPeriodPayload,
  GetBlockedPeriodsParams,
  UpdateBlockedPeriodPayload,
} from '../types/types';
import { getBlockedPeriodConflictInfo } from '../utils/conflictError';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage } from '@/src/utils/helpers';
import { EMPTY_PAGINATION_META } from '@/src/types';

export function useBlockedPeriods(clinicId: string | undefined, params?: GetBlockedPeriodsParams) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: blockedPeriodKeys.list(clinicId ?? '', params),
    queryFn: () => blockedPeriodsApi.list(clinicId!, params),
    enabled: !!clinicId,
  });

  return {
    blockedPeriods: data?.data ?? [],
    meta: data?.meta ?? EMPTY_PAGINATION_META,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}

/**
 * `silent` skips this hook's own success/error toast — used when a caller
 * is firing several creates in a row (multi-select fan-out) and wants to
 * show one consolidated "created N of M" message itself instead of N
 * stacked individual toasts.
 */
export function useCreateBlockedPeriodMutation(clinicId: string | undefined, options?: { silent?: boolean }) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const silent = options?.silent ?? false;

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: (payload: CreateBlockedPeriodPayload) => blockedPeriodsApi.create(clinicId!, payload),
    onSuccess: () => {
      if (!silent) showSuccess('Blocked period created.', 'Blocked period saved');
      queryClient.invalidateQueries({ queryKey: blockedPeriodKeys.all(clinicId!) });
    },
    onError: (err) => {
      if (getBlockedPeriodConflictInfo(err)) return;
      if (!silent) showError(getApiErrorMessage(err, 'Failed to create blocked period.'), 'Create failed');
    },
  });

  return { createBlockedPeriod: mutate, createBlockedPeriodAsync: mutateAsync, isPending };
}

export function useUpdateBlockedPeriodMutation(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBlockedPeriodPayload }) =>
      blockedPeriodsApi.update(clinicId!, id, payload),
    onSuccess: () => {
      showSuccess('Blocked period updated.', 'Blocked period saved');
      queryClient.invalidateQueries({ queryKey: blockedPeriodKeys.all(clinicId!) });
    },
    onError: (err) => {
      if (getBlockedPeriodConflictInfo(err)) return;
      showError(getApiErrorMessage(err, 'Failed to update blocked period.'), 'Update failed');
    },
  });

  return { updateBlockedPeriod: mutate, updateBlockedPeriodAsync: mutateAsync, isPending };
}

export function useDeleteBlockedPeriodMutation(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => blockedPeriodsApi.delete(clinicId!, id),
    onSuccess: () => {
      showSuccess('Blocked period deleted.', 'Blocked period removed');
      queryClient.invalidateQueries({ queryKey: blockedPeriodKeys.all(clinicId!) });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to delete blocked period.'), 'Delete failed');
    },
  });

  return { deleteBlockedPeriod: mutate, deleteBlockedPeriodAsync: mutateAsync, isPending };
}


export function useBlockedPeriodConflictsMutation(clinicId: string | undefined) {
  const { mutateAsync, isPending, data } = useMutation({
    mutationFn: (payload: BlockedPeriodConflictsPayload) =>
      blockedPeriodsApi.previewConflicts(clinicId!, payload),
  });

  return { previewConflictsAsync: mutateAsync, isPending, conflicts: data };
}
