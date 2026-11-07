'use client';

import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { AppointmentManagement } from '@/src/features/appointments/components/AppointmentManagement';
import { AppointmentService } from '@/src/features/appointments/types/types';
import { useClinicServices } from '@/src/features/services/hooks/useServices';
export default function MyClinicAppointmentsPage() {
   const { user } = useAuthStore();
  const clinicId = user?.clinicId;
  // High limit because this list feeds a dropdown selector, not a paginated table.
  const { services, isLoading, error, refetch } = useClinicServices(clinicId as string, {
    limit: 15,
  });
 
  if (isLoading) return <LoadingState message="Loading..." page />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} page />;
  if (!clinicId) return null;
  
  return (
    <AppointmentManagement clinicId={clinicId as string} services={services as AppointmentService[]} />
  );
}
