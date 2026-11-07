import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import type { LoginFormData } from '../schemas/login.schema';
import { useToast } from '@/src/components/ui/ToastProvider';

export const useLogin = () => {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);
  const { showSuccess, showError } = useToast();

  const mutation = useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: (data) => {
  
      loginStore(data.accessToken ?? '', data.user);

      showSuccess(`Welcome back, ${data.user.fullName}!`, 'Logged in successfully');

      switch (data.user.role) {
        case 'clinic_admin':
          router.push('/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    },
    onError: (error: unknown) => {
      console.error('Login error:', error);
      const e = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message ||
        e?.message ||
        'Unable to log in. Please check your credentials.';
      showError(message, 'Login failed');
    },
  });

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
};
