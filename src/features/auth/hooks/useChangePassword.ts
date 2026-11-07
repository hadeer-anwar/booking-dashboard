import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage } from '@/src/utils/helpers';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}


export function useChangePassword() {
  const { showSuccess, showError } = useToast();

  const mutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    onSuccess: () => {
      showSuccess(
        'Your password has been updated. You\'ve been signed out everywhere else.',
        'Password changed'
      );
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Failed to change password.'), 'Change failed');
    },
  });

  return {
    changePassword: mutation.mutate,
    changePasswordAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
