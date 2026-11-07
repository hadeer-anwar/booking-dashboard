'use client';

import { Clock } from 'lucide-react';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { ClinicScheduleTab } from '@/src/features/schedule/components/ClinicScheduleTab';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useClinic } from '@/src/features/clinics/hooks/useClinic';

export default function MyClinicSchedulePage() {
  const { user } = useAuthStore();
  const clinicId = user?.clinicId;
  const{clinic, isLoading, error, refetch} = useClinic(clinicId as string);

  if (isLoading) return <LoadingState message="Loading schedule..." page />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} page />;
  if (!clinicId || !user?.id) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <DashboardPageHeader icon={Clock} title="Schedule" description={`Working hours for ${clinic?.name ?? 'your clinic'}`} />
      {clinic && (<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ClinicScheduleTab clinic={clinic} clinicId={clinicId} onSaved={() => void refetch()} />
      </div>)}
    </div>
  );
}
