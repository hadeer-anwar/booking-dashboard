'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import type { ClinicSchedule } from '@/src/features/schedule/types/types';
import { formatTime24To12, to24hString } from '@/src/utils/helpers';
import { useUpdateScheduleMutation } from '../hooks/useStaff';
import {
  type DayState,
  scheduleToDayStates,
  buildFullSchedulePayload,
  validateSchedule,
} from '../utils/schedule.utils';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';

/* ─── Props ───────────────────────────────────────────────────────────────── */

export interface EditProviderScheduleModalProps {
  open: boolean;
  clinicId: string;
  providerId: string;
  schedule: ClinicSchedule | null | undefined;
  onClose: () => void;
  onSaved?: () => void;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function EditProviderScheduleModal({
  open,
  clinicId,
  providerId,
  schedule,
  onClose,
  onSaved,
}: EditProviderScheduleModalProps) {
  const [dayStates, setDayStates] = useState<DayState[]>(() => scheduleToDayStates(null));

  const { updateScheduleAsync, isPending } = useUpdateScheduleMutation();

  /* ── Sync state when the modal opens or the schedule prop changes ──────── */
  useEffect(() => {
    if (!open) return;
    setDayStates(scheduleToDayStates(schedule ?? null));
  }, [open, schedule]);

  if (!open) return null;

  /* ── Day helpers ─────────────────────────────────────────────────────── */

  const updateDay = (dayIndex: number, updater: (prev: DayState) => DayState) => {
    setDayStates((prev) => prev.map((d, i) => (i === dayIndex ? updater(d) : d)));
  };

  const toggleDayOpen = (dayIndex: number) => {
    updateDay(dayIndex, (d) => ({
      ...d,
      isOpen: !d.isOpen,
      // When opening: seed with a default slot if none exist yet.
      hours: !d.isOpen && d.hours.length === 0 ? [{ start: '09:00', end: '17:00' }] : d.hours,
    }));
  };

  const addSlot = (dayIndex: number) => {
    updateDay(dayIndex, (d) => ({
      ...d,
      hours: [...d.hours, { start: '09:00', end: '17:00' }],
    }));
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    updateDay(dayIndex, (d) => ({
      ...d,
      hours: d.hours.filter((_, i) => i !== slotIndex),
    }));
  };

  const updateSlot = (
    dayIndex: number,
    slotIndex: number,
    field: 'start' | 'end',
    value: string
  ) => {
    updateDay(dayIndex, (d) => ({
      ...d,
      hours: d.hours.map((h, i) => (i === slotIndex ? { ...h, [field]: value } : h)),
    }));
  };

  /* ── Submit ──────────────────────────────────────────────────────────── */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateSchedule(dayStates);
    if (validationError) return; // error toast is shown by the mutation's onError

    const payload = buildFullSchedulePayload(dayStates);

    updateScheduleAsync(
      { clinicId, providerId, payload },
      {
        onSuccess: () => {
          onSaved?.();
          onClose();
        },
        onError: () => {
          onClose();
        },
      }
    );
  };

  /* ── Render ──────────────────────────────────────────────────────────── */

  return createPortal(
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_CLASS}>

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 pb-3 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit schedule</h2>
            <p className="mt-1 text-sm text-gray-500">
              Set hours per day (shown in 12h). Closed days: turn off &quot;Open&quot;.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2.5 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {dayStates.map((dayState, dayIndex) => (
              <div
                key={dayState.day}
                className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4"
              >
                {/* Day header: name + open toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{dayState.day}</span>
                  <label className="flex cursor-pointer items-center gap-2">
                    <span className="text-xs text-gray-600">Open</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={dayState.isOpen}
                      onClick={() => toggleDayOpen(dayIndex)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        dayState.isOpen ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          dayState.isOpen ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>

                {/* Time slots */}
                {dayState.isOpen && (
                  <div className="space-y-2">
                    {dayState.hours.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateSlot(dayIndex, slotIndex, 'start', e.target.value)}
                          className="rounded-xl border border-gray-300 px-2 py-1.5 text-sm"
                        />
                        <span className="text-sm text-gray-400">–</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateSlot(dayIndex, slotIndex, 'end', e.target.value)}
                          className="rounded-xl border border-gray-300 px-2 py-1.5 text-sm"
                        />
                        <span className="text-xs text-gray-500">
                          {formatTime24To12(to24hString(slot.start))} –{' '}
                          {formatTime24To12(to24hString(slot.end))}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSlot(dayIndex, slotIndex)}
                          className="rounded p-1 text-gray-400 hover:text-red-600"
                          aria-label="Remove slot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSlot(dayIndex)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add time slot
                    </button>
                  </div>
                )}

                {!dayState.isOpen && (
                  <p className="text-xs italic text-gray-500">Closed</p>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse shrink-0 justify-end gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? 'Saving...' : 'Save schedule'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}