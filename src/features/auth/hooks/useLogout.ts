'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage } from '@/src/utils/helpers';

/**
 * Logs the current user out:
 *  - Calls POST /auth/logout (clears HttpOnly cookies server-side)
 *  - Clears the auth store
 *  - Wipes any cached query data
 *  - Redirects to the login page
 *
 * The local cleanup runs in `onSettled` so the user is signed out
 * client-side even if the server request fails.
 */
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutStore = useAuthStore((state) => state.logout);
  const { showSuccess, showError } = useToast();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: () => authApi.logout(),

    onSuccess: () => {
      showSuccess('You have been logged out.', 'Logout successful');
    },

    onError: (err) => {
      showError(
        getApiErrorMessage(err, 'An error occurred while logging out.'),
        'Logout failed'
      );
    },

    onSettled: () => {
      logoutStore();
      queryClient.clear();
      router.push('/login');
    },
  });

  return {
    logout: mutate,
    logoutAsync: mutateAsync,
    isPending,
    error,
  };
};
