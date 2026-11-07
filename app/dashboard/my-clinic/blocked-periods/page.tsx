'use client';

import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { BlockedPeriodsManagement } from '@/src/features/blockedPeriods/components/BlockedPeriodsManagement';

export default function MyClinicBlockedPeriodsPage() {
  const { user } = useAuthStore();
  const clinicId = user?.clinicId;

  if (!clinicId) return null;

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <BlockedPeriodsManagement clinicId={clinicId} />
    </div>
  );
}
