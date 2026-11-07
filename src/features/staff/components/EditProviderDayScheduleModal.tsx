'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Plus, Trash2 } from 'lucide-react';
import type { ClinicSchedule } from '@/src/features/schedule/types/types';
import { formatTime24To12, to24hString } from '@/src/utils/helpers';
import { useUpdateDayScheduleMutation } from '../hooks/useStaff';
import {
  type TimeSlot,
  ALL_WEEKDAYS,
  dayFromSchedule,
  buildSingleDaySchedulePayload,
  validateDaySlots,
} from '../utils/schedule.utils';
import { useToast } from '@/src/components/ui/ToastProvider';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';

/* ─── Props ───────────────────────────────────────────────────────────────── */

export interface EditProviderDayScheduleModalProps {
  open: boolean;
  clinicId: string;
  providerId: string;
  schedule: ClinicSchedule | null | undefined;
  /** Pre-select a specific day when the modal opens. Defaults to Monday. */
  initialDay?: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function EditProviderDayScheduleModal({
  open,
  clinicId,
  providerId,
  schedule,
  initialDay,
  onClose,
  onSaved,
}: EditProviderDayScheduleModalProps) {
  const [day, setDay] = useState<string>('Monday');
  const [isOpenDay, setIsOpenDay] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([{ start: '09:00', end: '17:00' }]);

  const { updateDayScheduleAsync, isPending } = useUpdateDayScheduleMutation();
 
  const { showError } = useToast();

  /* ── Sync a chosen day's data from the schedule into local state ───────── */
  const applyDay = useCallback(
    (dayName: string) => {
      const { isOpen, hours } = dayFromSchedule(dayName, schedule?.workingDays);
      setDay(dayName);
      setIsOpenDay(isOpen);

      if (isOpen && hours.length > 0) {
        setSlots(hours);
      } else if (isOpen) {
        // Open but no stored hours — seed with a sensible default.
        setSlots([{ start: '09:00', end: '17:00' }]);
      } else {
        setSlots([]);
      }
    },
    [schedule]
  );

  /* ── Re-sync whenever the modal opens or initialDay changes ────────────── */
  useEffect(() => {
    if (!open) return;
    const startDay =
      initialDay && (ALL_WEEKDAYS as readonly string[]).includes(initialDay)
        ? initialDay
        : 'Monday';
    applyDay(startDay);
  }, [open, initialDay, applyDay]);

  if (!open) return null;

  /* ── Slot helpers ────────────────────────────────────────────────────── */

  const addSlot = () =>
    setSlots((prev) => [...prev, { start: '09:00', end: '17:00' }]);

  const removeSlot = (index: number) =>
    setSlots((prev) => prev.filter((_, i) => i !== index));

  const updateSlot = (index: number, field: 'start' | 'end', value: string) =>
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  const toggleOpen = () => {
    setIsOpenDay((prev) => {
      const next = !prev;
      // Seed a default slot when switching to open with no existing slots.
      if (next && slots.length === 0) {
        setSlots([{ start: '09:00', end: '17:00' }]);
      }
      return next;
    });
  };

  /* ── Submit ──────────────────────────────────────────────────────────── */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateDaySlots(isOpenDay, slots);
    if (validationError) {
      showError(validationError, 'Invalid schedule');
      return;
    }

    const payload = buildSingleDaySchedulePayload(day, isOpenDay, slots, schedule);

    updateDayScheduleAsync(
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
            <h2 className="text-lg font-semibold text-gray-900">Edit day</h2>
            <p className="mt-1 text-sm text-gray-500">
              Change hours for one weekday. Closed days have no time slots. Times use 24h
              input; preview shows 12h.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2.5 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6 pt-4"
        >
          <div className="space-y-5">

            {/* Day selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Day</label>
              <select
                value={day}
                onChange={(e) => applyDay(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-brand-400"
              >
                {ALL_WEEKDAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Open / closed toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-800">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Open this day</span>
              </div>
              <button
                type="button"
                onClick={toggleOpen}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isOpenDay ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isOpenDay ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Time slots (only shown when day is open) */}
            {isOpenDay && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-700">Time slots</p>

                {slots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 p-3"
                  >
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateSlot(idx, 'start', e.target.value)}
                      className="min-w-28 flex-1 rounded-xl border border-gray-300 px-2 py-1.5 text-sm"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateSlot(idx, 'end', e.target.value)}
                      className="min-w-28 flex-1 rounded-xl border border-gray-300 px-2 py-1.5 text-sm"
                    />
                    <span className="w-full text-[11px] text-gray-500 sm:w-auto">
                      {formatTime24To12(to24hString(slot.start))} –{' '}
                      {formatTime24To12(to24hString(slot.end))}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSlot}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add time slot
                </button>
              </div>
            )}

            {!isOpenDay && (
              <p className="text-xs italic text-gray-500">
                This day will be saved as closed (no operating hours).
              </p>
            )}

            {/* Footer actions */}
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-4 sm:flex-row">
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
                {isPending ? 'Saving...' : 'Save day'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}