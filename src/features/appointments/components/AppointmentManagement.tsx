'use client';

import { memo, useCallback, useState } from 'react';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { usePagination } from '@/src/hooks/usePagination';
import { Pagination } from '@/src/components/ui/Pagination';
import {
  CalendarX2,
  Loader2,
  CheckCircle2,
  CheckCheck,
  XCircle,
  Eye,
  Clock,
  User,
  UserPlus,
  Stethoscope,
  CalendarDays,
  Plus,
  Heart,
} from 'lucide-react';
import {  useAppointmentActions, useAppointments } from '../hooks/useAppointment';
import type { AppointmentStatus, Appointment, AppointmentService } from '../types/types';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { AssignProviderModal } from './AssignProviderModal';
import { AppointmentsToolbar } from './AppointmentsToolbar';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { KebabMenu, KebabMenuItem, KebabMenuSeparator } from '@/src/components/ui/KebabMenu';
import type { Service } from '@/src/features/services/types/types';

// ─── Table Row ────────────────────────────────────────────────────────────────

interface AppointmentTableRowProps {
  appointment: Appointment;
  onView: (a: Appointment) => void;
  onConfirm: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onAssign: (id: string) => void;
  isActing: boolean;
}

const AppointmentTableRow = memo(function AppointmentTableRow({
  appointment,
  onView,
  onConfirm,
  onComplete,
  onCancel,
  onAssign,
  isActing,
}: AppointmentTableRowProps) {
  const { status } = appointment;

  const canConfirm = status === 'pending';
  const canComplete = status === 'confirmed';
  const canCancel = status === 'pending' || status === 'confirmed' || status === 'pending_assignment';
  const canAssign = status === 'pending_assignment';

  return (
    <tr className="group border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-100/70">
      {/* Date & Time */}
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {appointment.date}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 pl-5">
            <Clock className="h-3 w-3 shrink-0 text-gray-300" />
            {appointment.start} – {appointment.end}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <AppointmentStatusBadge status={status} />
      </td>

      {/* Service */}
      <td className="px-5 py-4">
        <div className="flex items-start gap-1.5">
          <Stethoscope className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate max-w-[160px]">
              {appointment.service.name}
            </p>
            <p className="text-xs text-gray-400">
              {appointment.service.duration} min · {appointment.servicePrice.toLocaleString()} EGP
            </p>
          </div>
        </div>
      </td>

      {/* Provider */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          {appointment.provider ? (
            <span className="truncate max-w-[140px]">{appointment.provider.fullName}</span>
          ) : (
            <span className="italic text-gray-400">Unassigned</span>
          )}
        </div>
      </td>

      {/* Customer */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
            <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {appointment.customer.phoneNumber && (
            <span>{appointment.customer.phoneNumber}</span>
          )}
          </div>
        
        </div>
      </td>

      {/* Actions menu */}
      <td className="px-3 py-4 w-12">
        <KebabMenu>
          {(close) => (
            <>
              <KebabMenuItem icon={Eye} onClick={() => { close(); onView(appointment); }}>
                View details
              </KebabMenuItem>
              {canAssign && (
                <KebabMenuItem
                  icon={UserPlus}
                  tone="accent"
                  disabled={isActing}
                  onClick={() => { close(); onAssign(appointment.id); }}
                >
                  Assign provider
                </KebabMenuItem>
              )}
              {canConfirm && (
                <KebabMenuItem
                  icon={CheckCircle2}
                  tone="info"
                  disabled={isActing}
                  onClick={() => { close(); onConfirm(appointment.id); }}
                >
                  Confirm
                </KebabMenuItem>
              )}
              {canComplete && (
                <KebabMenuItem
                  icon={CheckCheck}
                  tone="success"
                  disabled={isActing}
                  onClick={() => { close(); onComplete(appointment.id); }}
                >
                  Mark complete
                </KebabMenuItem>
              )}
              {canCancel && (canAssign || canConfirm || canComplete) && <KebabMenuSeparator />}
              {canCancel && (
                <KebabMenuItem
                  icon={XCircle}
                  tone="danger"
                  disabled={isActing}
                  onClick={() => { close(); onCancel(appointment.id); }}
                >
                  Cancel
                </KebabMenuItem>
              )}
            </>
          )}
        </KebabMenu>
      </td>
    </tr>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

interface AppointmentManagementProps {
  clinicId: string;
  services?: AppointmentService[];
}

export const AppointmentManagement = ({
  clinicId,
  services,
}: AppointmentManagementProps) => {
  const [activeStatus, setActiveStatus] = useState<AppointmentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [assignTarget, setAssignTarget] = useState<Appointment | null>(null);

  const statusParam = activeStatus === 'all' ? undefined : activeStatus;
  // Reset to page 1 whenever the search, status, or date range filter changes.
  const { page, limit, setPage } = usePagination({
    resetKey: `${debouncedSearch}|${statusParam ?? ''}|${dateFrom}|${dateTo}`,
  });
  const { appointments, isLoading, isFetching, isError, meta } = useAppointments(clinicId, {
    status: statusParam,
    search: debouncedSearch,
    page,
    limit,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  });
  const {
    confirmAppointment,
    completeAppointment,
    cancelAppointment,
    assignProvider,
    isConfirming,
    isCompleting,
    isCancelling,
    isAssigning,
  } = useAppointmentActions(clinicId);

  const isActing = isConfirming || isCompleting || isCancelling || isAssigning;

  /**
   * The backend requires `cancellationReason` on the cancel endpoint, so
   * we open a small modal to collect it instead of calling cancel directly.
   * Wrapped in useCallback (not just for tidiness) — it's passed as a prop
   * into the memoized AppointmentTableRow, so an unstable reference here
   * would silently defeat that memoization on every render.
   */
  const openCancelModal = useCallback(
    (id: string) => {
      const target = appointments.find((a) => a.id === id) ?? null;
      if (target) setCancelTarget(target);
    },
    [appointments]
  );

  const submitCancellation = async (cancellationReason: string) => {
    if (!cancelTarget) return;
    try {
      await cancelAppointment({
        id: cancelTarget.id,
        payload: { cancellationReason },
      });
      setCancelTarget(null);
    } catch {
      // Toast surfaced by the mutation's onError handler.
    }
  };

  /** Opens the provider picker for a "pending_assignment" appointment. Same reasoning as openCancelModal above. */
  const openAssignModal = useCallback(
    (id: string) => {
      const target = appointments.find((a) => a.id === id) ?? null;
      if (target) setAssignTarget(target);
    },
    [appointments]
  );

  const submitAssignment = async (providerId: string) => {
    if (!assignTarget) return;
    try {
      await assignProvider({ id: assignTarget.id, payload: { providerId } });
      setAssignTarget(null);
    } catch {
      // Toast surfaced by the mutation's onError handler.
    }
  };


  const filtered = appointments;

 
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const awaitingProviderCount = appointments.filter((a) => a.status === 'pending_assignment').length;
  const total = meta.total;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <DashboardPageHeader
        icon={CalendarDays}
        title="Appointments"
        description="Manage and track all clinic appointments"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-900">
            <CalendarDays className="h-4 w-4 text-gray-600 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Total</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{total}</p>
          </div>
        </div>

        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 transition-colors group-hover:bg-blue-500">
            <CheckCircle2 className="h-4 w-4 text-blue-500 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Confirmed</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{confirmedCount}</p>
          </div>
        </div>

        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-amber-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 transition-colors group-hover:bg-amber-400">
            <Clock className="h-4 w-4 text-amber-500 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Pending</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{pendingCount}</p>
          </div>
        </div>

        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-violet-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 transition-colors group-hover:bg-violet-500">
            <UserPlus className="h-4 w-4 text-violet-500 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Pending Assignment</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{awaitingProviderCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar: search + status tabs + Book button */}
      <AppointmentsToolbar
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        search={search}
        onSearchChange={setSearch}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onAddAppointment={() => setShowCreate(true)}
        total={total}
      />

      {/* States */}
      {isLoading && !debouncedSearch ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-3" />
          <span className="text-sm">Loading appointments...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
          <CalendarX2 className="h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Failed to load appointments.</p>
          <p className="text-xs text-gray-400">Please try refreshing the page.</p>
        </div>
      ) : appointments.length === 0 && meta.total === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No appointments yet"
          description="Book appointments for your clinic patients and track them here."
          action={{ label: 'Book First Appointment', icon: Plus, onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">All Appointments</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                {meta.total} {meta.total === 1 ? 'item' : 'items'}
              </span>
            </div>
            <span className="text-[11px] text-gray-400">Sorted by date</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">
                      Date & Time
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Service
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Provider
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Customer
                    </th>
                    <th className="px-3 py-3.5 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((appt) => (
                    <AppointmentTableRow
                      key={appt.id}
                      appointment={appt}
                      isActing={isActing}
                      onView={setDetailAppointment}
                      onConfirm={confirmAppointment}
                      onComplete={completeAppointment}
                      onCancel={openCancelModal}
                      onAssign={openAssignModal}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                        No appointments match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.limit}
              itemLabel="appointment"
              onPageChange={setPage}
              isFetching={isFetching}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-5">
        <button className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[11px] font-medium text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700">
          <Heart className="h-3 w-3" />
          Made with Lola Clinic Admin
        </button>
      </div>

      {/* Modals */}
      <AppointmentDetailModal
        open={!!detailAppointment}
        appointment={detailAppointment}
        onClose={() => setDetailAppointment(null)}
        onConfirm={confirmAppointment}
        onComplete={completeAppointment}
        onCancel={(id) => {
          setDetailAppointment(null);
          openCancelModal(id);
        }}
        onAssignProvider={(id) => {
          setDetailAppointment(null);
          openAssignModal(id);
        }}
        isActing={isActing}
      />

      <CreateAppointmentModal
        open={showCreate}
        clinicId={clinicId}
        services={services as Service[]}
        onClose={() => setShowCreate(false)}
        onBooked={() => setShowCreate(false)}
      />

      <CancelAppointmentModal
        open={!!cancelTarget}
        appointment={cancelTarget}
        isSubmitting={isCancelling}
        onClose={() => {
          if (!isCancelling) setCancelTarget(null);
        }}
        onConfirm={submitCancellation}
      />

      <AssignProviderModal
        open={!!assignTarget}
        appointment={assignTarget}
        isSubmitting={isAssigning}
        onClose={() => {
          if (!isAssigning) setAssignTarget(null);
        }}
        onAssign={submitAssignment}
      />
    </div>
  );
};