'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { isClinicManagerRole } from '@/src/types';
import { useClinicSettings } from '@/src/features/settings/hooks/useClinicSettings';
import { ClinicSettingsTab } from '@/src/features/settings/components/ClinicSettingsTab';
import { EditClinicSettingsModal } from '@/src/features/settings/components/EditClinicSettingsModal';

export function ClinicSettingsManagement() {
  const { user } = useAuthStore();
  const clinicId = isClinicManagerRole(user?.role) ? user?.clinicId : undefined;
  // Settings write is a real backend RBAC split, not just a UI nicety: the
  // backend 403s a clinic_admin's PATCH/PUT with FORBIDDEN_CLINIC_SETTINGS
  // (only moderator/super_admin are in SETTINGS_MODIFIER_ROLES) — clinic_admin
  // keeps read access to this page but never sees the edit affordance.
  const canEditSettings = user?.role === 'moderator' || user?.role === 'super_admin';

  const [isEditOpen, setIsEditOpen] = useState(false);
  const { clinicSettings, isLoading } = useClinicSettings(clinicId ?? '');

  if (isLoading) return <LoadingState message="Loading settings..." page />;
  if (!clinicSettings) return <div className="text-center py-10">No settings found</div>;

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        <DashboardPageHeader
          icon={Settings}
          title="Clinic Settings"
          description="Manage appointment rules and clinic preferences"
        />
        <ClinicSettingsTab
          clinicId={clinicId ?? ''}
          onEdit={canEditSettings ? () => setIsEditOpen(true) : undefined}
        />
      </div>

      <EditClinicSettingsModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        clinicId={clinicId ?? ''}
        initialSettings={clinicSettings}
      />
    </>
  );
}
