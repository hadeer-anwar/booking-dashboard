'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { ClinicStaffMemberDetailPage } from '@/src/features/staff/components/ClinicStaffMemberDetailPage';
import { EditProviderDayScheduleModal } from '@/src/features/staff/components/EditProviderDayScheduleModal';
import { EditProviderScheduleModal } from '@/src/features/staff/components/EditProviderScheduleModal';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useMemberSchedule } from '@/src/features/staff/hooks/useStaff';

export default function MyClinicStaffMemberPage() {
  const params = useParams();
  const providerId = params?.providerId as string | undefined;

  const { user } = useAuthStore();
  const clinicId = user?.clinicId;

  /* ── Modal state ─────────────────────────────────────────────────────── */
  const [editFullOpen, setEditFullOpen] = useState(false);
  const [editDayOpen, setEditDayOpen] = useState(false);
  const [editDayInitial, setEditDayInitial] = useState<string | null>(null);

  
  const { schedule: memberSchedule, isLoading, error, refetch } = useMemberSchedule(
    clinicId as string,
    providerId as string
  );

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const handleScheduleSaved = () => {
    setEditFullOpen(false);
    setEditDayOpen(false);
    setEditDayInitial(null);
  };

  const handleOpenDaySchedule = (day: string | null) => {
    setEditDayInitial(day);
    setEditDayOpen(true);
  };

  /* ── Guards ──────────────────────────────────────────────────────────── */
  if (isLoading) return <LoadingState message="Loading…" page />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} page />;
  if (!clinicId || !providerId ) return null;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <>
      <ClinicStaffMemberDetailPage
        clinicId={clinicId}
        providerId={providerId}
        backHref="/dashboard/my-clinic/staff"
        backLabel="Back to staff"
        clinicName={""}
        onOpenFullSchedule={() => setEditFullOpen(true)}
        onOpenDaySchedule={handleOpenDaySchedule}
      />

      {/* Edit single day modal */}
      <EditProviderDayScheduleModal
        open={editDayOpen}
        clinicId={clinicId}
        providerId={providerId}
        schedule={memberSchedule ?? null}
        initialDay={editDayInitial}
        onClose={() => {
          setEditDayOpen(false);
          setEditDayInitial(null);
        }}
        onSaved={handleScheduleSaved}
      />

      {/* Edit full schedule modal */}
      <EditProviderScheduleModal
        open={editFullOpen}
        clinicId={clinicId}
        providerId={providerId}
        // FIX: same as above — pass memberSchedule directly.
        schedule={memberSchedule ?? null}
        onClose={() => setEditFullOpen(false)}
        onSaved={handleScheduleSaved}
      />
    </>
  );
}