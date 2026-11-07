'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useClinics } from '@/src/features/clinics/hooks/useClinics';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { AddClinicModal } from '@/src/features/clinics/components/AddClinicModal';
import { UpdateClinicModal } from '@/src/features/clinics/components/UpdateClinicModal';
import { DeleteClinicModal } from '@/src/features/clinics/components/DeleteClinicModal';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { usePagination } from '@/src/hooks/usePagination';
import { Pagination } from '@/src/components/ui/Pagination';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  CalendarDays,
  Info,
  Edit2,
  Trash2,
  ChevronRight,
  ImagePlus,
} from 'lucide-react';
import { UploadImagesModal } from '@/src/components/ui/UploadImagesModal';
import { useUploadClinicImagesMutation } from '@/src/features/clinics/hooks/useClinic';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { KebabMenu, KebabMenuItem, KebabMenuSeparator } from '@/src/components/ui/KebabMenu';
import type { Clinic, ClinicWorkingDay } from '../types/types';

export const ClinicsManagement = () => {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editClinic, setEditClinic] = useState<Clinic | null>(null);
  const [deleteClinic, setDeleteClinic] = useState<Clinic | null>(null);
  const [uploadImagesClinic, setUploadImagesClinic] = useState<Clinic | null>(null);
  const { uploadClinicImages, isPending: isUploading } = useUploadClinicImagesMutation(uploadImagesClinic?.id);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const { page, limit, setPage } = usePagination({ resetKey: debouncedSearch });
  const queryClient = useQueryClient();
  const { clinics, meta, isLoading, isFetching, isError, error, refetch } = useClinics(undefined, {
    search: debouncedSearch,
    page,
    limit,
  });
  const { user } = useAuthStore();

  const canAddClinic = user?.role === 'super_admin';

  // Server already filtered by search, so the "filtered" view is just the page.
  const filtered = clinics;


  const activeCount = clinics?.filter((c) => c.isActive).length ?? 0;
  const inactiveCount = (clinics?.length ?? 0) - activeCount;
  const withScheduleCount = clinics?.filter((c) => (c.schedule?.workingDays?.length ?? 0) > 0).length ?? 0;

  const handleClinicAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['clinics'] });
  };

  const errorMessage =
    (error as Error | undefined)?.message || 'Failed to load clinics. Please try again later.';


  if (isLoading && !debouncedSearch) return <LoadingState message="Loading clinics..." page />;
  if (isError) return <ErrorState message={errorMessage} onRetry={() => refetch()} page />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <DashboardPageHeader
        icon={Building2}
        title="Clinics"
        description="Manage all clinic locations, schedules, and services"
        badge={
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80 backdrop-blur-sm">
            {meta.total} {meta.total === 1 ? 'clinic' : 'clinics'}
          </span>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <Building2 className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-900">{meta.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Active</p>
            <p className="text-xl font-bold text-gray-900">{activeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Inactive</p>
            <p className="text-xl font-bold text-gray-900">{inactiveCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <CalendarDays className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Scheduled</p>
            <p className="text-xl font-bold text-gray-900">{withScheduleCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or address…"
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
          />
        </div>
        {canAddClinic && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Clinic
          </button>
        )}
      </div>

      {/* Data table */}
      {filtered.length > 0 || meta.total > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Clinic
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Address
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Phone
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Schedule
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 w-24">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((clinic, idx) => {
                  const isOpen = clinic.isActive !== false;
                  const schedDays = clinic.schedule?.workingDays?.filter((d: ClinicWorkingDay) => d.isOpen)?.length ?? 0;

                  return (
                    <tr
                      key={clinic.id}
                      onClick={() => router.push(`/dashboard/clinics/${clinic.id}`)}
                      className="group cursor-pointer border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-100/70 animate-fade-in-up"
                      style={{ '--stagger-index': idx } as React.CSSProperties}
                    >
                      {/* Clinic name */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-gray-950">{clinic.name}</span>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 text-gray-800">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="truncate max-w-[200px]">{clinic.address || '—'}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3">
                        {clinic.phone ? (
                          <div className="flex items-center gap-2 text-gray-800">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span>{clinic.phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Schedule */}
                      <td className="px-5 py-3">
                        {schedDays > 0 ? (
                          <div className="flex items-center gap-2 text-gray-800">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span>{schedDays} day{schedDays !== 1 ? 's' : ''}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No schedule</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <StatusBadge active={isOpen} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center">
                          <KebabMenu ariaLabel="Actions">
                            {(close) => (
                              <>
                                <KebabMenuItem
                                  icon={Info}
                                  onClick={() => { close(); router.push(`/dashboard/clinics/${clinic.id}`); }}
                                >
                                  View details
                                </KebabMenuItem>
                                <KebabMenuItem icon={Edit2} onClick={() => { close(); setEditClinic(clinic); }}>
                                  Edit clinic
                                </KebabMenuItem>
                                <KebabMenuItem
                                  icon={ImagePlus}
                                  onClick={() => { close(); setUploadImagesClinic(clinic); }}
                                >
                                  Upload Photos
                                </KebabMenuItem>
                                <KebabMenuSeparator />
                                <KebabMenuItem icon={Trash2} tone="danger" onClick={() => { close(); setDeleteClinic(clinic); }}>
                                  Delete
                                </KebabMenuItem>
                              </>
                            )}
                          </KebabMenu>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/clinics/${clinic.id}`);
                            }}
                            className="ml-1 rounded-lg p-1.5 text-gray-300 hover:text-gray-600 transition-colors lg:opacity-0 lg:group-hover:opacity-100"
                            aria-label="Go to details"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.limit}
            itemLabel="clinic"
            onPageChange={setPage}
            isFetching={isFetching}
          />
        </div>
      ) : (
        /* Empty state */
        <EmptyState
          icon={Building2}
          title="No clinics yet"
          description="Get started by creating your first clinic location."
          variant="subtle"
          action={canAddClinic ? { label: 'Add Your First Clinic', icon: Plus, onClick: () => setIsAddOpen(true) } : undefined}
        />
      )}

      {/* Modals */}
      {canAddClinic && (
        <AddClinicModal
          open={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onAdded={handleClinicAdded}
        />
      )}
      <UpdateClinicModal
        open={Boolean(editClinic)}
        clinic={editClinic}
        onClose={() => setEditClinic(null)}
      />
      <DeleteClinicModal
        open={Boolean(deleteClinic)}
        clinic={deleteClinic}
        onClose={() => setDeleteClinic(null)}
      />
      <UploadImagesModal
        open={Boolean(uploadImagesClinic)}
        onClose={() => setUploadImagesClinic(null)}
        title="Upload Clinic Photos"
        entityName={uploadImagesClinic?.name}
        onUpload={(files) => uploadClinicImages(files)}
        isUploading={isUploading}
      />
    </div>
  );
};
