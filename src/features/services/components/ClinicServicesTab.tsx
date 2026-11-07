'use client';

import { useCallback, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useClinicWorkspace } from '@/src/features/clinics/context/ClinicWorkspaceContext';
import { AssignServiceProviderModal } from '@/src/features/staff/components/AssignServiceProviderModal';
import { AddServiceModal } from '@/src/features/services/components/AddServiceModal';
import { ServicesTable } from '@/src/features/services/components/ServiceTable';
import { ServicesEmptyState } from '@/src/features/services/components/ServiceEmptyState';
import type { Service } from '@/src/features/services/types/types';
import { UpdateServiceModal } from '@/src/features/services/components/UpdateServiceModal';
import { useUpdateServiceStatusMutation } from '@/src/features/services/hooks/useServices';

export function ClinicServicesTab() {
  const {
    clinicId,
    clinicName,
    staffProviders,
    services,
    categories,
    servicesMeta: meta,
    setServicesPage: onPageChange,
    isServicesFetching: isFetching,
    servicesSearch: search,
    setServicesSearch: onSearchChange,
    servicesIsActive: isActive,
    setServicesIsActive: onStatusFilterChange,
    refetchClinic,
  } = useClinicWorkspace();

  const [assignService, setAssignService] = useState<Service | null>(null);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [updateServiceOpen, setUpdateServiceOpen] = useState(false);
  const [updateService, setUpdateService] = useState<Service | null>(null);

  const { updateServiceStatusAsync: updateStatusMutation } = useUpdateServiceStatusMutation();

  const handleServiceAdded = async () => {
    setAddServiceOpen(false);
    await refetchClinic();
  };

  // Stable references — passed into the memoized ServiceTableRow (via
  // ServicesTable), so inline/re-created closures here would silently
  // defeat that memo on every render of this tab.
  const handleEditService = useCallback((service: Service) => {
    setUpdateService(service);
    setUpdateServiceOpen(true);
  }, []);

  const handleServiceUpdated = async () => {
    setUpdateServiceOpen(false);
    setUpdateService(null);
    await refetchClinic();
  };

  const handleStatusChange = useCallback(
    async (service: Service, nextActive: boolean) => {
      await updateStatusMutation({ id: service.id, isActive: nextActive });
      await refetchClinic();
    },
    [updateStatusMutation, refetchClinic]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Services &amp; Providers</h2>
          <p className="mt-1 text-xs text-gray-500">
            Manage clinic services and their assigned providers
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddServiceOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by service name or description…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs font-medium">
          {(
            [
              { label: 'Active', value: true },
              { label: 'Not Active', value: false },
            ] as { label: string; value: boolean }[]
          ).map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => onStatusFilterChange(isActive === value ? undefined : value)}
              className={`rounded-md px-3 py-2 transition-colors ${
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

      {services.length > 0 || (meta && meta.total > 0) ? (
        <ServicesTable
          services={services}
          categories={categories}
          clinicId={clinicId}
          onAssignProvider={setAssignService}
          onStatusChange={handleStatusChange}
          onEditService={handleEditService}
          meta={meta}
          onPageChange={onPageChange}
          isFetching={isFetching}
        />
      ) : (
        <ServicesEmptyState onAddService={() => setAddServiceOpen(true)} />
      )}

      <AssignServiceProviderModal
        open={Boolean(assignService)}
        clinicId={clinicId}
        service={assignService as Service}
        staffProviders={staffProviders}
        onClose={() => setAssignService(null)}
        onAssigned={() => void refetchClinic()}
      />

      <AddServiceModal
        open={addServiceOpen}
        lockedClinicId={clinicId}
        lockedClinicName={clinicName}
        onClose={() => setAddServiceOpen(false)}
        onSaved={handleServiceAdded}
      />

      <UpdateServiceModal
        open={updateServiceOpen}
        service={updateService}
        lockedClinicId={clinicId}
        lockedClinicName={clinicName}
        onClose={() => {
          setUpdateServiceOpen(false);
          setUpdateService(null);
        }}
        onSaved={handleServiceUpdated}
      />
    </div>
  );
}
