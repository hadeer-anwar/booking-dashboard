'use client';

import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Ban, CircleCheck, Users, ImagePlus } from 'lucide-react';
import { resolveMediaUrl } from '@/src/lib/api/media';
import { useServiceAssignments } from '@/src/features/staff/hooks/useServiceAssignments';
import { ServiceProvidersModal } from './ServiceProvidersModal';
import { UploadImagesModal } from '@/src/components/ui/UploadImagesModal';
import { KebabMenu, KebabMenuItem, KebabMenuSeparator } from '@/src/components/ui/KebabMenu';
import { useUploadServiceImagesMutation } from '../hooks/useServices';
import { Service } from '../types/types';

interface ServiceTableRowProps {
  service: Service;
  categories: { id: string; name: string }[];
  clinicId: string;
  onAssignProvider: (service: Service) => void;
  onEditService?: (service: Service) => void;
  onDeleteService?: (service: Service) => void;
  onStatusChange?: (service: Service, isActive: boolean) => void | Promise<void>;
}

export const ServiceTableRow = memo(function ServiceTableRow({
  service,
  categories,
  clinicId,
  onAssignProvider,
  onEditService,
  onDeleteService,
  onStatusChange,
}: ServiceTableRowProps) {
  const [providersModalOpen, setProvidersModalOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [uploadImagesOpen, setUploadImagesOpen] = useState(false);
  const { uploadServiceImages, isPending: isUploading } = useUploadServiceImagesMutation();

  
  const { assignments, loading, refetch } = useServiceAssignments({
    clinicId,
    serviceId: service.id,
    enabled: providersModalOpen,
  });

  const categoryName = service.categoryId
    ? categories.find((c) => c.id === service.categoryId)?.name
    : null;

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

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <tr className="group border-b border-gray-100 transition-colors hover:bg-gray-100/70">
        {/* Spacer (keeps header column alignment) */}
        <td className="w-10 py-3.5 pl-3 pr-0" />

        {/* Image */}
        <td className="w-16 px-3 py-3.5">
          {service.images?.[0] ? (
            <div className="h-8 w-8 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <img
                src={resolveMediaUrl(service.images[0])}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-[10px] text-gray-400">
              —
            </div>
          )}
        </td>

        {/* Service name */}
        <td className="px-4 py-3.5">
          <span className="text-sm font-medium text-gray-900 line-clamp-1">{service.name}</span>
        </td>

        {/* Duration */}
        <td className="w-24 px-4 py-3.5">
          {service.duration != null ? (
            <span className="text-sm text-gray-700 whitespace-nowrap">{service.duration} min</span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>

        {/* Price */}
        <td className="w-28 px-4 py-3.5">
          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
            {formatPrice(service.price)}
          </span>
        </td>

        {/* Category */}
        <td className="w-36 px-4 py-3.5">
          {categoryName ? (
            <span className="inline-block rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 whitespace-nowrap">
              {categoryName}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>

        {/* Providers count — clicking opens the modal */}
        <td className="w-32 px-4 py-3.5">
          <button
            type="button"
            onClick={() => setProvidersModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-2 py-1 text-sm text-gray-700 transition-colors hover:border-gray-200 hover:bg-white"
            title="View assigned providers"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                service.providersCount > 0 ? 'bg-emerald-400' : 'bg-gray-300'
              }`}
            />
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <span className="whitespace-nowrap">
              {service.providersCount} provider{service.providersCount !== 1 ? 's' : ''}
            </span>
          </button>
        </td>

        {/* Actions menu */}
        <td
          className="w-12 px-3 py-3.5"
          onClick={(e) => e.stopPropagation()}
        >
          {hasActions && (
            <KebabMenu>
              {(close) => (
                <>
                  {onEditService && (
                    <KebabMenuItem icon={Pencil} onClick={() => { close(); onEditService(service); }}>
                      Edit service
                    </KebabMenuItem>
                  )}
                  <KebabMenuItem icon={ImagePlus} onClick={() => { close(); setUploadImagesOpen(true); }}>
                    Upload Photos
                  </KebabMenuItem>
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

      {/* Modals — portaled to body so they are never children of <tbody> */}
      {typeof document !== 'undefined' && createPortal(
        <>
          <UploadImagesModal
            open={uploadImagesOpen}
            onClose={() => setUploadImagesOpen(false)}
            title="Upload Service Photos"
            entityName={service.name}
            onUpload={(files) => uploadServiceImages({ id: service.id, files })}
            isUploading={isUploading}
          />
          <ServiceProvidersModal
            open={providersModalOpen}
            service={service}
            clinicId={clinicId}
            assignments={assignments}
            loading={loading}
            onClose={() => setProvidersModalOpen(false)}
            onAssignProvider={() => {
              setProvidersModalOpen(false);
              onAssignProvider(service);
            }}
            onChanged={async () => {
              await refetch();
            }}
          />
        </>,
        document.body
      )}
    </>
  );
});
