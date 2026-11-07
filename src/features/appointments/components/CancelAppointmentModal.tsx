'use client';

import { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import type { Appointment } from '../types/types';
import { ConfirmActionModal } from '@/src/components/ui/ConfirmActionModal';

interface CancelAppointmentModalProps {
  open: boolean;
  appointment: Appointment | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (cancellationReason: string) => void | Promise<void>;
}

const MAX_REASON_LENGTH = 280;

export const CancelAppointmentModal = ({
  open,
  appointment,
  isSubmitting = false,
  onClose,
  onConfirm,
}: CancelAppointmentModalProps) => {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  // Reset whenever the modal closes or the target appointment changes.
  useEffect(() => {
    if (!open) {
      setReason('');
      setTouched(false);
    }
  }, [open, appointment?.id]);

  if (!appointment) return null;

  const trimmed = reason.trim();
  const isInvalid = trimmed.length === 0;

  const handleConfirm = async () => {
    setTouched(true);
    if (isInvalid || isSubmitting) return;
    await onConfirm(trimmed);
  };

  return (
    <ConfirmActionModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      icon={XCircle}
      title="Cancel Appointment"
      description="Tell the customer why this appointment is being cancelled."
      confirmLabel="Cancel appointment"
      confirmingLabel="Cancelling…"
      confirmIcon={XCircle}
      cancelLabel="Keep appointment"
      isSubmitting={isSubmitting}
      disableConfirm={isInvalid}
      layout="sectioned"
    >
      {/* Appointment summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5 text-xs text-gray-600">
        <p className="font-medium text-gray-800 truncate">
          {appointment.service.name || 'Appointment'}
        </p>
        <p className="mt-0.5 text-gray-500">
          {appointment.date} · {appointment.start} – {appointment.end}
        </p>
        {appointment.customer.fullName && (
          <p className="mt-0.5 text-gray-500 truncate">
            Customer: {appointment.customer.fullName}
          </p>
        )}
      </div>

      {/* Reason */}
      <div className="space-y-1.5">
        <label htmlFor="cancel-reason" className="block text-xs font-medium text-gray-700">
          Cancellation reason <span className="text-red-500">*</span>
        </label>
        <textarea
          id="cancel-reason"
          autoFocus
          rows={3}
          maxLength={MAX_REASON_LENGTH}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. Provider unavailable, customer requested rescheduling…"
          className={`w-full resize-none rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-brand-400/20 ${
            touched && isInvalid
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-brand-400'
          }`}
        />
        <div className="flex items-center justify-between">
          {touched && isInvalid ? (
            <p className="text-[11px] text-red-600">A reason is required.</p>
          ) : (
            <span className="text-[11px] text-gray-400">
              This reason will be saved with the appointment record.
            </span>
          )}
          <span className="text-[11px] text-gray-400">
            {reason.length}/{MAX_REASON_LENGTH}
          </span>
        </div>
      </div>
    </ConfirmActionModal>
  );
};
