'use client';

import { useState } from 'react';
import { Building2, Clock, Users, Briefcase } from 'lucide-react';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { UpdateClinicModal } from '@/src/features/clinics/components/UpdateClinicModal';
import { UploadImagesModal } from '@/src/components/ui/UploadImagesModal';
import { ClinicOverviewTab } from '@/src/features/clinics/components/ClinicOverviewTab';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useClinic, useUploadClinicImagesMutation } from '@/src/features/clinics/hooks/useClinic';
import { useAuthStore } from '@/src/features/auth/store/auth.store';

export default function MyClinicOverviewPage() {
  const { user } = useAuthStore();
  const clinicId = user?.clinicId;
  const { clinic, isLoading, error } = useClinic(clinicId);
  const [isEditClinicOpen, setIsEditClinicOpen] = useState(false);
  const [isUploadPhotosOpen, setIsUploadPhotosOpen] = useState(false);
  const { uploadClinicImages, isPending: isUploading } = useUploadClinicImagesMutation(clinicId);

  if (isLoading) return <LoadingState message="Loading your clinic..." page />;
  if (error) return <ErrorState message={error.message} page />;
  if (!clinic) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <DashboardPageHeader className="mb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-100">
            <Building2 className="h-6 w-6 text-brand-800" />
          </div>
          <div>
            <h1 className="font-heading text-2xl text-gray-900 sm:text-3xl">{clinic.name}</h1>
            <p className="mt-1 text-sm text-gray-500">Clinic overview and general information</p>
          </div>
        </div>
      </DashboardPageHeader>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-900">
            <Users className="h-5 w-5 text-gray-600 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Providers</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{clinic.providersCount ?? '—'}</p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-900">
            <Briefcase className="h-5 w-5 text-gray-600 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Services</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{clinic.servicesCount ?? '—'}</p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 transition-colors group-hover:bg-blue-500">
            <Users className="h-5 w-5 text-blue-600 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Admins</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{clinic.clinicAdminsCount ?? '—'}</p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-900">
            <Clock className="h-5 w-5 text-gray-600 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Working days</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{clinic.schedule?.workingDays?.filter((d) => d.isOpen).length ?? 0}/7</p>
          </div>
        </div>
      </div>

      {/* Overview content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ClinicOverviewTab
          clinic={clinic}
          onEdit={() => setIsEditClinicOpen(true)}
          onUploadPhotos={() => setIsUploadPhotosOpen(true)}
        />
      </div>

      {/* Modals */}
      <UpdateClinicModal
        open={isEditClinicOpen}
        clinic={clinic}
        onClose={() => setIsEditClinicOpen(false)}
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