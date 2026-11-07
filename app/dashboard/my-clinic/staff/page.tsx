'use client';

import { useCallback, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { ClinicStaffTab } from '@/src/features/staff/components/ClinicStaffTab';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { useClinicStaff } from '@/src/features/staff/hooks/useStaff';
import { useClinic } from '@/src/features/clinics/hooks/useClinic';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { usePagination } from '@/src/hooks/usePagination';
import {
  ClinicWorkspaceProvider,
  type ClinicWorkspaceContextValue,
} from '@/src/features/clinics/context/ClinicWorkspaceContext';
import type { Service } from '@/src/features/services/types/types';

// Stable, shared across renders so the memoized workspace value below (which
// this page always populates with an empty services/categories set) doesn't
// get a fresh array reference — and therefore a fresh context identity — on
// every render for no reason.
const EMPTY_SERVICES: Service[] = [];
const EMPTY_CATEGORIES: { id: string; name: string }[] = [];

export default function MyClinicStaffPage() {
  const { user } = useAuthStore();
  const clinicId = user?.clinicId;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const { page, limit, setPage } = usePagination({ resetKey: debouncedSearch });

  const {
    providers: staffProviders,
    clinicAdmin: staffAdmins,
    moderators: staffModerators,
    meta,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useClinicStaff(clinicId as string, {
    search: debouncedSearch,
    page,
    limit,
  });

  const { clinic, refetch: refetchClinicQuery } = useClinic(clinicId as string);

  const refetchClinic = useCallback(() => {
    void refetchClinicQuery();
  }, [refetchClinicQuery]);
  const noopSetServicesSearch = useCallback(() => {}, []);
  const noopSetServicesIsActive = useCallback(() => {}, []);

  // Memoized for the same reason as the other two workspace pages — this
  // page's own filters/pagination shouldn't force a new context identity.
  const workspaceValue: ClinicWorkspaceContextValue = useMemo(
    () => ({
      clinicId: clinicId ?? '',
      clinicName: clinic?.name,
      staffDetailBasePath: '/dashboard/my-clinic/staff',
      staffProviders,
      staffAdmins,
      staffModerators,
      staffSearch: search,
      setStaffSearch: setSearch,
      staffMeta: meta,
      setStaffPage: setPage,
      isStaffFetching: isFetching,
      refetchStaff: refetch,
      services: EMPTY_SERVICES,
      categories: EMPTY_CATEGORIES,
      servicesSearch: '',
      setServicesSearch: noopSetServicesSearch,
      servicesIsActive: undefined,
      setServicesIsActive: noopSetServicesIsActive,
      refetchClinic,
    }),
    [
      clinicId,
      clinic?.name,
      staffProviders,
      staffAdmins,
      staffModerators,
      search,
      setSearch,
      meta,
      setPage,
      isFetching,
      refetch,
      noopSetServicesSearch,
      noopSetServicesIsActive,
      refetchClinic,
    ]
  );

  if (isLoading && !debouncedSearch) return <LoadingState message="Loading staff…" page />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} page />;
  if (!clinicId || !clinic) return null;

  const totalStaff = meta.total;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <DashboardPageHeader
        icon={Users}
        title="Team"
        description="Manage providers and administrators for clinic"
        badge={
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80 backdrop-blur-sm">
            {totalStaff} {totalStaff === 1 ? 'member' : 'members'}
          </span>
        }
      />
      <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <ClinicWorkspaceProvider value={workspaceValue}>
          <ClinicStaffTab />
        </ClinicWorkspaceProvider>
      </div>
    </div>
  );
}
