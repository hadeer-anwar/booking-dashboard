'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicKeys } from '@/src/features/clinics/queryKeys';
import { scheduleApi } from '@/src/features/schedule/api/schedule.api';
import type { Clinic } from '@/src/features/clinics/types/types';
import type { UpdateSchedulePartialPayload } from '@/src/features/schedule/types/types';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage } from '@/src/utils/helpers';

export function useUpdateClinicScheduleMutation(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const { mutate, mutateAsync, isPending } = useMutation<
    Clinic,
    Error,
    UpdateSchedulePartialPayload
  >({
    mutationFn: (payload) => scheduleApi.updateClinicSchedulePartial(clinicId!, payload),

    onSuccess: (updatedClinic) => {
      queryClient.setQueryData(clinicKeys.detail(clinicId!), updatedClinic);

      if (updatedClinic.schedule) {
        queryClient.setQueryData(clinicKeys.schedule(clinicId!), updatedClinic.schedule);
      }

      queryClient.invalidateQueries({ queryKey: clinicKeys.detail(clinicId!) });
      queryClient.invalidateQueries({ queryKey: clinicKeys.schedule(clinicId!) });

      showSuccess('Schedule updated successfully.', 'Schedule saved');
    },

    onError: (error) => {
      console.error('Error updating schedule:', error);
      showError(getApiErrorMessage(error, 'Failed to update schedule.'), 'Update failed');
    },
  });

  return {
    updateSchedule: mutate,
    updateScheduleAsync: mutateAsync,
    isPending,
  };
}

export function useAddClinicScheduleMutation(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: (payload: {
      workingDays: UpdateSchedulePartialPayload['workingDays'];
    }) => scheduleApi.addClinicSchedule(clinicId!, payload),

    onSuccess: (updatedClinic) => {
      queryClient.setQueryData(clinicKeys.detail(clinicId!), updatedClinic);

      if (updatedClinic.schedule) {
        queryClient.setQueryData(clinicKeys.schedule(clinicId!), updatedClinic.schedule);
      }

      queryClient.invalidateQueries({ queryKey: clinicKeys.detail(clinicId!) });
      queryClient.invalidateQueries({ queryKey: clinicKeys.schedule(clinicId!) });

      showSuccess('Day schedule saved.', 'Schedule updated');
    },

    onError: (error) => {
      console.error('Error adding schedule:', error);
      showError(getApiErrorMessage(error, 'Failed to save schedule.'), 'Save failed');
    },
  });

  return {
    addSchedule: mutate,
    addScheduleAsync: mutateAsync,
    isPending,
  };
}
