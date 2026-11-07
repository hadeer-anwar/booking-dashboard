'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clinicsApi } from '@/src/features/clinics/api/clinics.api';
import type { Clinic, CreateClinicPayload, UpdateClinicPayload } from '../types/types';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage, hasApiValidationErrors } from '@/src/utils/helpers';
import { clinicKeys } from '@/src/features/clinics/queryKeys';

export function useClinic(clinicId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery<Clinic>({
    queryKey: clinicKeys.detail(clinicId ?? ''),
    enabled: !!clinicId,
    queryFn: () => clinicsApi.getClinicById(clinicId!),
  });

  return {
    clinic: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateClinicMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const { mutate, mutateAsync, isPending, error } = useMutation<
    Clinic,
    Error,
    CreateClinicPayload
  >({
    mutationFn: (payload) => clinicsApi.createClinic(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicKeys.all });
      showSuccess('Clinic created successfully.', 'Clinic added');
    },

    onError: (err) => {
      showError(
        getApiErrorMessage(err, 'Failed to create clinic.'),
        hasApiValidationErrors(err) ? 'Validation failed' : 'Create failed'
      );
    },
  });

  return {
    createClinic: mutate,
    createClinicAsync: mutateAsync,
    isPending,
    error,
  };
}

export function useUpdateClinicMutation(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const { mutate, mutateAsync, isPending } = useMutation<Clinic, Error, UpdateClinicPayload>({
    mutationFn: (clinic) => clinicsApi.updateClinic(clinicId!, clinic),

    onSuccess: (updatedClinic) => {
      queryClient.setQueryData(clinicKeys.detail(clinicId!), updatedClinic);
      queryClient.invalidateQueries({ queryKey: clinicKeys.detail(clinicId!) });
      queryClient.invalidateQueries({ queryKey: clinicKeys.all });
      showSuccess('Clinic updated successfully.', 'Changes saved');
    },

    onError: (error) => {
      console.error('Error updating clinic:', error);
      showError(getApiErrorMessage(error, 'Failed to update clinic.'), 'Update failed');
    },
  });

  return {
    updateClinic: mutate,
    updateClinicAsync: mutateAsync,
    isPending,
  };
}

export function useUploadClinicImagesMutation(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (files: File[]) => clinicsApi.uploadClinicImages(clinicId!, files),
    onSuccess: () => {
      showSuccess('Images uploaded successfully.', 'Photos updated');
      queryClient.invalidateQueries({ queryKey: clinicKeys.detail(clinicId ?? '') });
      queryClient.invalidateQueries({ queryKey: clinicKeys.all });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to upload images.'), 'Upload failed');
    },
  });

  return { uploadClinicImages: mutateAsync, isPending };
}
