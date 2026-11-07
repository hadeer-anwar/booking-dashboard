'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useServices,
  useUpdateServiceStatusMutation,
} from '@/src/features/services/hooks/useServices';
import { useClinics } from '@/src/features/clinics/hooks/useClinics';
import { useClinic } from '@/src/features/clinics/hooks/useClinic';
import { useCategories } from '@/src/features/categories/hooks/useCategories';
import { ServicesToolbar } from '@/src/features/services/components/ServicesToolbar';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { AddServiceModal } from '@/src/features/services/components/AddServiceModal';
import { UpdateServiceModal } from '@/src/features/services/components/UpdateServiceModal';
import { DeleteServiceModal } from '@/src/features/services/components/DeleteServiceModal';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { isClinicManagerRole } from '@/src/types';
import { type Service } from '@/src/features/services/types/types';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { usePagination } from '@/src/hooks/usePagination';
import { Pagination } from '@/src/components/ui/Pagination';
import {
  Briefcase,
  Plus,
  Heart,
  Clock,
  Pencil,
  Trash2,
  CircleCheck,
  Ban,
  Building2,
  Tag,
} from 'lucide-react';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { KebabMenu, KebabMenuItem, KebabMenuSeparator } from '@/src/components/ui/KebabMenu';
import { resolveMediaUrl } from '@/src/lib/api/media';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ServiceTableRowProps {
  service: Service;
  clinicName?: string;
  categoryName?: string;
  showClinic: boolean;
  onEditService?: (service: Service) => void;
  onDeleteService?: (service: Service) => void;
  onStatusChange?: (service: Service, isActive: boolean) => void | Promise<void>;
}

const ServiceTableRow = memo(function ServiceTableRow({
  service,
  clinicName,
  categoryName,
  showClinic,
  onEditService,
  onDeleteService,
  onStatusChange,
}: ServiceTableRowProps) {
  const [statusBusy, setStatusBusy] = useState(false);
  const hasActions = Boolean(onEditService || onDeleteService || onStatusChange);

  const runStatusChange = async (nextActive: boolean) => {
    if (!onStatusChange || statusBusy) return;
    setStatusBusy(true);
    try {
      await onStatusChange(service, nextActive);
    } finally {
      setStatusBusy(false);
    }
  };



  return (
    <tr className="group border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-100/70">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {service.images?.[0] ? (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveMediaUrl(service.images[0])}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
          <span className="font-medium text-gray-900 truncate">{service.name}</span>
        </div>
      </td>
      {showClinic && (
        <td className="px-5 py-4">
          {clinicName ? (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate max-w-[140px]">{clinicName}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
      )}
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            service.isActive
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15'
              : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
          }`}
        >
          {service.isActive ? 'Active' : 'Inactive'}
        </span>
        {statusBusy ? (
          <span className="ml-2 text-[10px] font-medium text-gray-400">Updating…</span>
        ) : null}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>{formatDuration(service.duration)}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        {categoryName ? (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Tag className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate max-w-[140px]">{categoryName}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
        {formatUpdatedAt(service.updatedAt)}
      </td>
      <td className="px-3 py-4 w-12">
        {hasActions && (
          <KebabMenu>
            {(close) => (
              <>
                {onEditService && (
                  <KebabMenuItem icon={Pencil} onClick={() => { close(); onEditService(service); }}>
                    Edit service
                  </KebabMenuItem>
                )}
                {onDeleteService && (
                  <KebabMenuItem icon={Trash2} tone="danger" onClick={() => { close(); onDeleteService(service); }}>
                    Delete
                  </KebabMenuItem>
                )}
                {onStatusChange && (onEditService || onDeleteService) && <KebabMenuSeparator />}
                {onStatusChange && service.isActive && (
                  <KebabMenuItem
                    icon={Ban}
                    tone="warning"
                    disabled={statusBusy}
                    onClick={async () => { close(); await runStatusChange(false); }}
                  >
                    Deactivate
                  </KebabMenuItem>
                )}
                {onStatusChange && !service.isActive && (
                  <KebabMenuItem
                    icon={CircleCheck}
                    tone="success"
                    disabled={statusBusy}
                    onClick={async () => { close(); await runStatusChange(true); }}
                  >
                    Activate
                  </KebabMenuItem>
                )}
              </>
            )}
          </KebabMenu>
        )}
      </td>
    </tr>
  );
});

export const ServicesManagement = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const { page, limit, setPage } = usePagination({ resetKey: `${debouncedSearch}-${isActive}` });

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isClinicManager = isClinicManagerRole(user?.role);
  const ownClinicId = isClinicManager ? user?.clinicId : undefined;

  const { clinic: ownClinic } = useClinic(isClinicManager ? ownClinicId : undefined);

  const { services, meta, isLoading, isFetching, isError, error, refetch } = useServices({
    clinicId: ownClinicId,
    search: debouncedSearch,
    page,
    limit,
    isActive,
  });
  // Used to look up clinic names for the table; needs the full list, not a page.
  const { clinics } = useClinics(undefined, { enabled: !isClinicManager, limit: 15 });
  const { categories } = useCategories(ownClinicId ? { clinicId: ownClinicId } : undefined);

  const { updateServiceStatusAsync } = useUpdateServiceStatusMutation();

  const handleServiceUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['services'] });
    refetch();
  };

  const canManageServices = user?.role === 'super_admin' || isClinicManagerRole(user?.role);

  const clinicMap = useMemo(() => {
    if (isClinicManager && ownClinic) {
      return { [ownClinic.id]: ownClinic.name };
    }
    const map: Record<string, string> = {};
    clinics.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [isClinicManager, ownClinic, clinics]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const sortedServices = useMemo(() => {
    if (!services?.length) return [];
    return [...services].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [services]);

  // Stable references — passed into the memoized ServiceTableRow, so inline
  // arrows recreated every render would silently defeat that memo.
  const handleEditService = useCallback((s: Service) => {
    setSelectedService(s);
    setIsEditOpen(true);
  }, []);
  const handleDeleteService = useCallback((s: Service) => {
    setSelectedService(s);
    setIsDeleteOpen(true);
  }, []);
  const handleStatusChange = useCallback(
    async (s: Service, nextActive: boolean) => {
      try {
        await updateServiceStatusAsync({ id: s.id, isActive: nextActive });
        refetch();
      } catch {
        // Toast surfaced by the mutation's onError handler.
      }
    },
    [updateServiceStatusAsync, refetch]
  );

  const errorMessage =
    (error as Error | undefined)?.message || 'Failed to load services. Please try again later.';

  // Show the full-page loader only on the very first load — keep typing
  // responsive while later debounced searches refetch in the background.
  if (isLoading && !debouncedSearch) return <LoadingState message="Loading services..." page />;
  if (isError) return <ErrorState message={errorMessage} onRetry={() => refetch()} page />;

  // NOTE: With server-side pagination, `services` only holds the current page.
  // The Active/Inactive cards therefore show "on this page" counts. The Total
  // card uses `meta.total` so it reflects the entire result set.
  const activeCount = services?.filter((s) => s.isActive).length ?? 0;
  const inactiveCount = (services?.length ?? 0) - activeCount;
  const activePercent = services?.length ? Math.round((activeCount / services.length) * 100) : 0;

  const showClinicColumn = !isClinicManager;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <DashboardPageHeader
        icon={Briefcase}
        title="Services"
        description={
          isClinicManager
            ? 'Manage services for your clinic.'
            : 'Manage services offered by your clinics'
        }
      />

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-900">
            <Briefcase className="h-4.5 w-4.5 text-gray-600 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Total Services</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{meta.total}</p>
          </div>
        </div>

        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-500">
            <span className="flex h-3 w-3 items-center justify-center">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 transition-colors group-hover:bg-white" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Active</p>
            <div className="mt-0.5 flex items-end gap-2">
              <p className="font-heading text-2xl text-gray-900">{activeCount}</p>
              {services?.length ? (
                <span className="mb-0.5 text-xs font-medium text-emerald-600">{activePercent}%</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-200">
            <Clock className="h-4.5 w-4.5 text-gray-500" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Inactive</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{inactiveCount}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ServicesToolbar
          onAddService={canManageServices ? () => setIsAddOpen(true) : undefined}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by service name or description…"
        />
        <div className="flex items-center gap-1 self-start rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs font-medium sm:self-auto">
          {(
            [
              { label: 'Active', value: true },
              { label: 'Not Active', value: false },
            ] as { label: string; value: boolean }[]
          ).map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => setIsActive((prev) => (prev === value ? undefined : value))}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                isActive === value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(services && services.length > 0) || meta.total > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">All Services</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                {meta.total} {meta.total === 1 ? 'item' : 'items'}
              </span>
            </div>
            <span className="text-[11px] text-gray-400">Sorted by name</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Name
                    </th>
                    {showClinicColumn && (
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Clinic
                      </th>
                    )}
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Duration
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Provider
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Category
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">
                      Updated
                    </th>
                    <th className="px-3 py-3.5 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {sortedServices.map((service) => (
                    <ServiceTableRow
                      key={service.id}
                      service={service}
                      clinicName={clinicMap[service.clinicId]}
                      categoryName={categoryMap[service.categoryId]}
                      showClinic={showClinicColumn}
                      onEditService={canManageServices ? handleEditService : undefined}
                      onDeleteService={canManageServices ? handleDeleteService : undefined}
                      onStatusChange={canManageServices ? handleStatusChange : undefined}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.limit}
              itemLabel="service"
              onPageChange={setPage}
              isFetching={isFetching}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No services yet"
          description="Add services to your clinics and assign them to categories so patients can book appointments."
          action={canManageServices ? { label: 'Add Your First Service', icon: Plus, onClick: () => setIsAddOpen(true) } : undefined}
        />
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-5">
        <button className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[11px] font-medium text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700">
          <Heart className="h-3 w-3" />
          Made with Lola Clinic Admin
        </button>
      </div>

      {canManageServices && (
        <>
          <AddServiceModal
            open={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            onSaved={() => refetch()}
            lockedClinicId={ownClinicId}
            lockedClinicName={ownClinic?.name}
          />
          <UpdateServiceModal
            open={isEditOpen}
            service={selectedService}
            onClose={() => {
              setIsEditOpen(false);
              setSelectedService(null);
            }}
            onSaved={handleServiceUpdated}
            lockedClinicId={ownClinicId}
          />
          <DeleteServiceModal
            open={isDeleteOpen}
            service={selectedService}
            onClose={() => {
              setIsDeleteOpen(false);
              setSelectedService(null);
            }}
            onConfirm={() => {
              void refetch();
            }}
          />
        </>
      )}
    </div>
  );
};
