'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clinicKeys } from '@/src/features/clinics/queryKeys';
import { settingsApi } from '@/src/features/settings/api/settings.api';
import type { ClinicSettings } from '@/src/features/settings/types/types';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage } from '@/src/utils/helpers';

export function useClinicSettings(clinicId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery<ClinicSettings>({
    queryKey: clinicKeys.settings(clinicId ?? ''),
    enabled: !!clinicId,
    queryFn: () => settingsApi.fetchSettings(clinicId!),
  });

  return {
    clinicSettings: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useUpdateClinicSettings(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const { mutate, mutateAsync, isPending } = useMutation<
    ClinicSettings,
    Error,
    ClinicSettings
  >({
    mutationFn: (settings) => settingsApi.updateSettings(clinicId!, settings),

    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(clinicKeys.settings(clinicId!), updatedSettings);
      queryClient.invalidateQueries({ queryKey: clinicKeys.settings(clinicId!) });
      showSuccess('Settings updated successfully.', 'Settings updated');
    },

    onError: (error) => {
      console.error('Error updating settings:', error);
      showError(getApiErrorMessage(error, 'Failed to update settings.'), 'Settings update failed');
    },
  });

  return {
    updateClinicSettings: mutate,
    updateClinicSettingsAsync: mutateAsync,
    isPending,
  };
}
