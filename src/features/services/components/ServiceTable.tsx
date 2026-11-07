import { ServiceTableRow } from './ServiceTableRow';
import { Service } from '../types/types';
import { Pagination, type PaginationMeta } from '@/src/components/ui/Pagination';

interface ServicesTableProps {
  services: Service[];
  categories: { id: string; name: string }[];
  clinicId: string;
  onAssignProvider: (service: Service) => void;
  onStatusChange: (service: Service, isActive: boolean) => void | Promise<void>;
  onEditService: (service: Service) => void;
  /** Pagination metadata for the current page (server-side). */
  meta?: PaginationMeta;
  /** Called when the user picks another page. */
  onPageChange?: (page: number) => void;
  /** True while a page request is in flight (for the footer spinner). */
  isFetching?: boolean;
}

export function ServicesTable({
  services,
  categories,
  clinicId,
  onAssignProvider,
  onStatusChange,
  onEditService,
  meta,
  onPageChange,
  isFetching,
}: ServicesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              {/* Chevron column */}
              <th className="w-10 py-3.5 pl-3 pr-0" />
              
              <th className="w-16 px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Image
              </th>
              
              <th className="w-44 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Service
              </th>
              
              <th className="w-24 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Duration
              </th>
              
              <th className="w-28 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Price
              </th>
              
              <th className="w-36 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Category
              </th>
              
              <th className="w-32 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Providers
              </th>
              
              <th className="w-12 px-3 py-3.5" />
             </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <ServiceTableRow
                key={service.id}
                service={service}
                categories={categories}
                clinicId={clinicId}
                onAssignProvider={onAssignProvider}
                onStatusChange={onStatusChange}
                onEditService={onEditService}
              />
            ))}
          </tbody>
         </table>
      </div>

      {meta && onPageChange ? (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={meta.limit}
          itemLabel="service"
          onPageChange={onPageChange}
          isFetching={isFetching}
        />
      ) : (
        <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-3 text-xs text-gray-500">
          {services.length} service{services.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}