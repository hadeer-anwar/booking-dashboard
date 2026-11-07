'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarX2, Filter, Pencil, Plus, Sparkles, Trash2, User } from 'lucide-react';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { usePagination } from '@/src/hooks/usePagination';
import { Pagination } from '@/src/components/ui/Pagination';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { KebabMenu, KebabMenuItem } from '@/src/components/ui/KebabMenu';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { useClinicStaff } from '@/src/features/staff/hooks/useStaff';
import { useClinicServices } from '@/src/features/services/hooks/useServices';
import { useBlockedPeriods } from '../hooks/useBlockedPeriods';
import { BlockedPeriodFormModal } from './BlockedPeriodFormModal';
import { DeleteBlockedPeriodModal } from './DeleteBlockedPeriodModal';
import { SegmentedTabs, type SegmentedTabOption } from '@/src/components/ui/SegmentedTabs';
import { ScopeBadge } from './ScopeBadge';
import type { BlockedPeriod } from '../types/types';

type ScopeFilter = 'all' | 'provider' | 'service';

interface BlockedPeriodsManagementProps {
  clinicId: string;
}

export function BlockedPeriodsManagement({ clinicId }: BlockedPeriodsManagementProps) {
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [targetFilter, setTargetFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const debouncedFrom = useDebouncedValue(dateFrom, 350);
  const debouncedTo = useDebouncedValue(dateTo, 350);

  const { page, limit, setPage } = usePagination({
    resetKey: `${scopeFilter}|${targetFilter}|${debouncedFrom}|${debouncedTo}`,
  });

  const { blockedPeriods, meta, isLoading, isFetching, isError, error, refetch } = useBlockedPeriods(
    clinicId,
    {
      scope: scopeFilter === 'all' ? undefined : scopeFilter,
      providerId: scopeFilter === 'provider' ? targetFilter || undefined : undefined,
      serviceId: scopeFilter === 'service' ? targetFilter || undefined : undefined,
      from: debouncedFrom || undefined,
      to: debouncedTo || undefined,
      page,
      limit,
    }
  );


  const { providers, error: providersError } = useClinicStaff(clinicId, { limit: 50 });
  const { services, isError: isServicesError } = useClinicServices(clinicId, { limit: 50 });
  const isProvidersError = Boolean(providersError);

  const providerMap = useMemo(() => {
    const map: Record<string, string> = {};
    providers.forEach((p) => {
      map[p.id] = p.fullName;
    });
    return map;
  }, [providers]);

  const serviceMap = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [services]);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BlockedPeriod | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlockedPeriod | null>(null);

  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const filterScopeOptions: SegmentedTabOption<ScopeFilter>[] = [
    { value: 'all', label: 'All', icon: Filter },
    {
      value: 'provider',
      label: 'By provider',
      icon: User,
      disabledReason: isProvidersError ? 'Provider list unavailable' : undefined,
    },
    {
      value: 'service',
      label: 'By service',
      icon: Sparkles,
      disabledReason: isServicesError ? 'Service list unavailable' : undefined,
    },
  ];

  const errorMessage =
    (error as Error | undefined)?.message || 'Failed to load blocked periods. Please try again.';

  if (isLoading) return <LoadingState message="Loading blocked periods..." page />;
  if (isError) return <ErrorState message={errorMessage} onRetry={() => refetch()} page />;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={CalendarX2}
        title="Blocked Periods"
        description="Close specific dates or time ranges to bookings — clinic-wide, or scoped to a provider or service."
      />

      {(isProvidersError || isServicesError) && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Couldn&apos;t load the {isProvidersError && isServicesError
              ? 'provider and service'
              : isProvidersError
              ? 'provider'
              : 'service'}{' '}
            list — filtering and scoping by {isProvidersError && isServicesError ? 'them' : 'it'} is
            unavailable right now. Blocked periods can still be viewed and created clinic-wide.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="shrink-0">
            <SegmentedTabs
              ariaLabel="Filter by scope"
              value={scopeFilter}
              onChange={(next) => {
                setScopeFilter(next);
                setTargetFilter('');
              }}
              options={filterScopeOptions}
              fitContent
            />
          </div>
          {scopeFilter !== 'all' && (
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="max-w-[180px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="">{scopeFilter === 'provider' ? 'Any provider' : 'Any service'}</option>
              {(scopeFilter === 'provider' ? providers : services).map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {'fullName' in entity ? entity.fullName : entity.name}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="From date"
            className="w-32 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="To date"
            className="w-32 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
          />
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add blocked period
        </button>
      </div>

      {blockedPeriods.length > 0 || meta.total > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Time
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Scope
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Reason
                  </th>
                  <th className="px-3 py-3.5 w-12" />
                </tr>
              </thead>
              <tbody>
                {blockedPeriods.map((bp) => (
                  <tr
                    key={bp.id}
                    className="group border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-100/70"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">{bp.date}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {bp.allDay ? (
                        <span className="italic text-gray-500">All day</span>
                      ) : (
                        `${bp.start} – ${bp.end}`
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <ScopeBadge
                        providerId={bp.providerId}
                        serviceId={bp.serviceId}
                        providerName={bp.providerId ? providerMap[bp.providerId] : undefined}
                        serviceName={bp.serviceId ? serviceMap[bp.serviceId] : undefined}
                      />
                    </td>
                    <td className="max-w-xs px-5 py-4">
                      {bp.reason?.trim() ? (
                        <span className="line-clamp-2 text-sm text-gray-600">{bp.reason}</span>
                      ) : (
                        <span className="text-xs italic text-gray-400">—</span>
                      )}
                    </td>
                    <td className="w-12 px-3 py-4">
                      <KebabMenu>
                        {(close) => (
                          <>
                            <KebabMenuItem
                              icon={Pencil}
                              onClick={() => {
                                close();
                                setEditTarget(bp);
                                setFormOpen(true);
                              }}
                            >
                              Edit
                            </KebabMenuItem>
                            <KebabMenuItem
                              icon={Trash2}
                              tone="danger"
                              onClick={() => {
                                close();
                                setDeleteTarget(bp);
                              }}
                            >
                              Delete
                            </KebabMenuItem>
                          </>
                        )}
                      </KebabMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.limit}
            itemLabel="blocked period"
            onPageChange={setPage}
            isFetching={isFetching}
          />
        </div>
      ) : (
        <EmptyState
          icon={CalendarX2}
          title="No blocked periods"
          description="Block a date or time range to prevent new bookings — for holidays, maintenance, or provider time off."
          action={{ label: 'Add blocked period', icon: Plus, onClick: openCreate }}
        />
      )}

      <BlockedPeriodFormModal
        // Remounts fresh every time the modal opens (or targets a different
        // row), so its internal state can be seeded straight from props
        // instead of needing a reset-on-open effect.
        key={formOpen ? (editTarget?.id ?? 'create') : 'closed'}
        open={formOpen}
        clinicId={clinicId}
        blockedPeriod={editTarget}
        providers={providers}
        services={services}
        providersUnavailable={isProvidersError}
        servicesUnavailable={isServicesError}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSaved={() => refetch()}
      />

      <DeleteBlockedPeriodModal
        open={Boolean(deleteTarget)}
        clinicId={clinicId}
        blockedPeriod={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => refetch()}
      />
    </div>
  );
}
