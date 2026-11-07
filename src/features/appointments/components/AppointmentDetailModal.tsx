'use client';

import { X, Clock, Calendar, User, Stethoscope, Phone, Mail, CheckCircle2, CheckCheck, XCircle, Loader2, UserPlus } from 'lucide-react';
import type { Appointment } from '../types/types';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';

interface AppointmentDetailModalProps {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onConfirm?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onAssignProvider?: (id: string) => void;
  isActing?: boolean;
}

const DetailRow = ({
  icon: Icon,
  label,
  value,
  iconClassName = 'text-gray-400',
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  iconClassName?: string;
}) => (
  <div className="flex items-start gap-3">
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 ${iconClassName}`}>
      <Icon className="h-4 w-4" />
    </span>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

export const AppointmentDetailModal = ({
  open,
  appointment,
  onClose,
  onConfirm,
  onComplete,
  onCancel,
  onAssignProvider,
  isActing = false,
}: AppointmentDetailModalProps) => {
  if (!open || !appointment) return null;

  const canConfirm = appointment.status === 'pending';
  const canComplete = appointment.status === 'confirmed';
  const canCancel =
    appointment.status === 'pending' ||
    appointment.status === 'confirmed' ||
    appointment.status === 'pending_assignment';
  const canAssign = appointment.status === 'pending_assignment';

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_CLASS}>
        {/* Status accent */}
        <div
          className={`h-1 w-full shrink-0 ${
            appointment.status === 'confirmed'
              ? 'bg-blue-400'
              : appointment.status === 'completed'
              ? 'bg-emerald-400'
              : appointment.status === 'cancelled'
              ? 'bg-gray-300'
              : appointment.status === 'pending_assignment'
              ? 'bg-violet-400'
              : 'bg-amber-400'
          }`}
        />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">Appointment Details</h2>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <p className="mt-1 text-xs text-gray-400">ID: {appointment.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Date & Time */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Schedule
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow icon={Calendar} label="Date" value={appointment.date} />
              <DetailRow
                icon={Clock}
                label="Time"
                value={`${appointment.start} – ${appointment.end}`}
              />
            </div>
          </section>

          {/* Service */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Service
            </h3>
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900 text-sm">{appointment.service.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 pl-6">
                <span>{appointment.service.duration} min</span>
                <span className="font-medium text-gray-700">{appointment.service.price.toLocaleString()} EGP</span>
              </div>
            </div>
          </section>

          {/* Provider */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Provider
            </h3>
            <div className="space-y-2">
              <DetailRow
                icon={User}
                label="Name"
                value={appointment.provider?.fullName ?? 'Not yet assigned'}
                iconClassName="text-blue-500"
              />
              {appointment.provider?.email && (
                <DetailRow icon={Mail} label="Email" value={appointment.provider.email} />
              )}
            </div>
          </section>

          {/* Customer */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Customer
            </h3>
            <div className="space-y-2">
              <DetailRow
                icon={User}
                label="Name"
                value={appointment.customer.fullName}
                iconClassName="text-emerald-600"
              />
              {appointment.customer.email && (
                <DetailRow icon={Mail} label="Email" value={appointment.customer.email} />
              )}
              {appointment.customer.phoneNumber && (
                <DetailRow icon={Phone} label="Phone" value={appointment.customer.phoneNumber} />
              )}
            </div>
          </section>

          {/* Note */}
          {appointment.notes && (
            <section className="space-y-2">
              <h3 className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                Note
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                {appointment.notes}
              </p>
            </section>
          )}
        </div>

        {/* Footer actions */}
        {(canConfirm || canComplete || canCancel || canAssign) && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
            {canAssign && (
              <button
                type="button"
                disabled={isActing}
                onClick={() => { onAssignProvider?.(appointment.id); onClose(); }}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Assign Provider
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                disabled={isActing}
                onClick={() => { onCancel?.(appointment.id); onClose(); }}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Cancel
              </button>
            )}
            {canConfirm && (
              <button
                type="button"
                disabled={isActing}
                onClick={() => { onConfirm?.(appointment.id); onClose(); }}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Confirm
              </button>
            )}
            {canComplete && (
              <button
                type="button"
                disabled={isActing}
                onClick={() => { onComplete?.(appointment.id); onClose(); }}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Mark Complete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
