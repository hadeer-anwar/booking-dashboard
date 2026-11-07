'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Users,
  Briefcase,
  Building2,
  CalendarX2,
  CheckCircle2,
  XCircle,
  Edit2,
  ImagePlus,
} from 'lucide-react';

import { useClinic } from '@/src/features/clinics/hooks/useClinic';
import { useClinicStaff } from '@/src/features/staff/hooks/useStaff';
import { useClinicServices } from '@/src/features/services/hooks/useServices';
import { useCategories } from '@/src/features/categories/hooks/useCategories';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { usePagination } from '@/src/hooks/usePagination';

import { UpdateClinicModal } from '@/src/features/clinics/components/UpdateClinicModal';
import { UploadImagesModal } from '@/src/components/ui/UploadImagesModal';
import { useUploadClinicImagesMutation } from '@/src/features/clinics/hooks/useClinic';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { ClinicOverviewTab } from '@/src/features/clinics/components/ClinicOverviewTab';
import { ClinicScheduleTab } from '@/src/features/schedule/components/ClinicScheduleTab';
import { ClinicServicesTab } from '@/src/features/services/components/ClinicServicesTab';
import { ClinicStaffTab } from '@/src/features/staff/components/ClinicStaffTab';
import { BlockedPeriodsManagement } from '@/src/features/blockedPeriods/components/BlockedPeriodsManagement';
import { AddClinicCategoryModal } from '@/src/features/clinics/components/AddClinicCategoryModal';
import { type Service } from '@/src/features/services/types/types';
import {
  ClinicWorkspaceProvider,
  type ClinicWorkspaceContextValue,
} from '@/src/features/clinics/context/ClinicWorkspaceContext';

type Tab = 'overview' | 'schedule' | 'services' | 'staff' | 'blocked';

export default function ClinicDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clinicId = params?.id as string | undefined;

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditClinicOpen, setIsEditClinicOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isUploadPhotosOpen, setIsUploadPhotosOpen] = useState(false);
  const { uploadClinicImages, isPending: isUploading } = useUploadClinicImagesMutation(clinicId);

  const [staffSearch, setStaffSearch] = useState('');
  const debouncedStaffSearch = useDebouncedValue(staffSearch, 350);
  const { page: staffPage, limit: staffLimit, setPage: setStaffPage } = usePagination({
    resetKey: debouncedStaffSearch,
  });

  const [servicesSearch, setServicesSearch] = useState('');
  const [servicesIsActive, setServicesIsActive] = useState<boolean | undefined>(undefined);
  const debouncedServicesSearch = useDebouncedValue(servicesSearch, 350);
  const {
    page: servicesPage,
    limit: servicesLimit,
    setPage: setServicesPage,
  } = usePagination({ resetKey: `${debouncedServicesSearch}-${servicesIsActive}` });

  const { clinic, isLoading, error, refetch } = useClinic(clinicId);
  const {
    providers: staffProviders,
    clinicAdmin: staffAdmins,
    moderators: staffModerators,
    meta: staffMeta,
    isFetching: isStaffFetching,
    refetch: refetchStaff,
  } = useClinicStaff(clinicId as string, {
    search: debouncedStaffSearch,
    page: staffPage,
    limit: staffLimit,
  });
  const {
    services: clinicServices,
    meta: servicesMeta,
    isFetching: isServicesFetching,
  } = useClinicServices(clinicId as string, {
    search: debouncedServicesSearch,
    page: servicesPage,
    limit: servicesLimit,
    isActive: servicesIsActive,
  });

  const { categories: clinicCategories } = useCategories({ clinicId: clinicId as string });

  // Stable wrapper so the memoized context value below doesn't churn every render.
  const refetchClinic = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Memoized so opening a modal or switching tabs on this page (state this
  // component owns but the context doesn't care about) doesn't force every
  // consumer of ClinicWorkspaceContext — the whole staff/services table — to
  // re-render along with it.
  const workspaceValue: ClinicWorkspaceContextValue = useMemo(
    () => ({
      clinicId: clinicId ?? '',
      clinicName: clinic?.name,
      staffDetailBasePath: `/dashboard/clinics/${clinicId}/staff`,
      staffProviders,
      staffAdmins,
      staffModerators,
      staffSearch,
      setStaffSearch,
      staffMeta,
      setStaffPage,
      isStaffFetching,
      refetchStaff,
      services: clinicServices as Service[],
      categories: clinicCategories,
      servicesMeta,
      setServicesPage,
      isServicesFetching,
      servicesSearch,
      setServicesSearch,
      servicesIsActive,
      setServicesIsActive,
      refetchClinic,
    }),
    [
      clinicId,
      clinic?.name,
      staffProviders,
      staffAdmins,
      staffModerators,
      staffSearch,
      setStaffSearch,
      staffMeta,
      setStaffPage,
      isStaffFetching,
      refetchStaff,
      clinicServices,
      clinicCategories,
      servicesMeta,
      setServicesPage,
      isServicesFetching,
      servicesSearch,
      setServicesSearch,
      servicesIsActive,
      setServicesIsActive,
      refetchClinic,
    ]
  );

  if (isLoading) return <LoadingState message="Loading clinic details..." page />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} page />;
  if (!clinic || !clinicId) return null;

  const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'blocked', label: 'Blocked Periods', icon: CalendarX2 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardPageHeader className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/dashboard/clinics')}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to clinics
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl text-gray-900 sm:text-3xl">{clinic.name}</h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                  clinic.isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-100 text-gray-600'
                }`}
              >
                {clinic.isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-gray-400" />
                )}
                {clinic.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Clinic profile with schedule, staff management, and service catalog
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadPhotosOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ImagePlus className="h-4 w-4" />
              Upload Photos
            </button>
            <button
              type="button"
              onClick={() => setIsEditClinicOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Edit2 className="h-4 w-4" />
              Edit Clinic
            </button>
          </div>
        </div>
      </DashboardPageHeader>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          {/* overflow-x-auto instead of wrapping — with 5 tabs this row is
              wider than a phone viewport, and the ancestor card is
              overflow-hidden, so without scroll the last tab(s) would be
              unreachable rather than just cramped. */}
          <div className="flex gap-6 overflow-x-auto px-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative shrink-0 whitespace-nowrap py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
                {activeTab === id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gray-900" />
                )}
              </button>
            ))}
          </div>
        </div>

        <ClinicWorkspaceProvider value={workspaceValue}>
          <div className="p-6">
            {activeTab === 'overview' && (
              <ClinicOverviewTab clinic={clinic} onEdit={() => setIsEditClinicOpen(true)} />
            )}

            {activeTab === 'schedule' && (
              <ClinicScheduleTab clinic={clinic} clinicId={clinicId} onSaved={() => void refetch()} />
            )}

            {activeTab === 'services' && <ClinicServicesTab />}

            {activeTab === 'staff' && <ClinicStaffTab />}

            {activeTab === 'blocked' && <BlockedPeriodsManagement clinicId={clinicId} />}
          </div>
        </ClinicWorkspaceProvider>
      </div>

      <AddClinicCategoryModal
        open={isAddCategoryOpen}
        clinicId={clinicId}
        onClose={() => setIsAddCategoryOpen(false)}
        onAdded={() => {
          setIsAddCategoryOpen(false);
          void refetch();
        }}
      />

      <UpdateClinicModal
        open={isEditClinicOpen}
        clinic={clinic}
        onClose={() => setIsEditClinicOpen(false)}
        onUpdated={() => void refetch()}
      />

      <UploadImagesModal
        open={isUploadPhotosOpen}
        onClose={() => setIsUploadPhotosOpen(false)}
        title="Upload Clinic Photos"
        entityName={clinic.name}
        onUpload={(files) => uploadClinicImages(files)}
        isUploading={isUploading}
      />
    </div>
  );
}
