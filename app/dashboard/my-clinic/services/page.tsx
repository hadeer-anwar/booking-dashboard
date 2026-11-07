'use client';

import { Briefcase } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { ClinicServicesTab } from '@/src/features/services/components/ClinicServicesTab';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Service } from '@/src/features/services/types/types';
import { useClinicServices } from '@/src/features/services/hooks/useServices';
import { useCategories } from '@/src/features/categories/hooks/useCategories';

import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { useClinicStaff } from '@/src/features/staff/hooks/useStaff';
import { useClinic } from '@/src/features/clinics/hooks/useClinic';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { usePagination } from '@/src/hooks/usePagination';
import {
  ClinicWorkspaceProvider,
  type ClinicWorkspaceContextValue,
} from '@/src/features/clinics/context/ClinicWorkspaceContext';

export default function MyClinicServicesPage() {
  const { user } = useAuthStore();
  const clinicId = user?.clinicId;

  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const { page, limit, setPage } = usePagination({ resetKey: `${debouncedSearch}-${isActive}` });

  const {
    services: clinicServices,
    meta,
    isLoading,
    isFetching,
    error,
  } = useClinicServices(clinicId as string, { search: debouncedSearch, page, limit, isActive });

  const { categories: clinicCategories } = useCategories({ clinicId: clinicId as string });
  const {
    providers: staffProviders,
    clinicAdmin: staffAdmins,
    moderators: staffModerators,
    refetch: refetchStaff,
  } = useClinicStaff(clinicId as string);
  const { clinic, refetch: refetchClinicQuery } = useClinic(clinicId as string);

  const refetchClinic = useCallback(() => {
    void refetchClinicQuery();
  }, [refetchClinicQuery]);
  const noopSetStaffSearch = useCallback(() => {}, []);

  // Memoized so this page's own state (search, active filter, pagination)
  // doesn't force a fresh context object — and a full re-render of the
  // services table — on every keystroke before the debounce settles.
  const workspaceValue: ClinicWorkspaceContextValue = useMemo(
    () => ({
      clinicId: clinicId ?? '',
      clinicName: clinic?.name,
      staffDetailBasePath: '/dashboard/my-clinic/staff',
      staffProviders,
      staffAdmins,
      staffModerators,
      staffSearch: '',
      setStaffSearch: noopSetStaffSearch,
      refetchStaff,
      services: clinicServices as Service[],
      categories: clinicCategories,
      servicesMeta: meta,
      setServicesPage: setPage,
      isServicesFetching: isFetching,
      servicesSearch: search,
      setServicesSearch: setSearch,
      servicesIsActive: isActive,
      setServicesIsActive: setIsActive,
      refetchClinic,
    }),
    [
      clinicId,
      clinic?.name,
      staffProviders,
      staffAdmins,
      staffModerators,
      noopSetStaffSearch,
      refetchStaff,
      clinicServices,
      clinicCategories,
      meta,
      setPage,
      isFetching,
      search,
      setSearch,
      isActive,
      setIsActive,
      refetchClinic,
    ]
  );

  if ((isLoading && !debouncedSearch) || !clinicId || !clinic) {
    return <LoadingState message="Loading services..." page />;
  }
  if (error) return <ErrorState message={error.message} page />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <DashboardPageHeader icon={Briefcase} title="Services" description={`Services offered by ${clinic.name}`} />
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ClinicWorkspaceProvider value={workspaceValue}>
          <ClinicServicesTab />
        </ClinicWorkspaceProvider>
      </div>
    </div>
  );
}
