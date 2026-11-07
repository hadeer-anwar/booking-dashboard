'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Clock, Plus, Trash2 } from 'lucide-react';
import type { ClinicSchedule, ClinicWorkingDay } from '@/src/features/schedule/types/types';
import { useAddClinicScheduleMutation } from '@/src/features/schedule/hooks/useSchedule';
import { useToast } from '@/src/components/ui/ToastProvider';
import { formatTime24To12, to24hString } from '@/src/utils/helpers';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_SCROLL_CLASS } from '@/src/components/ui/modal-shell';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface EditDayScheduleModalProps {
  open: boolean;
  clinicId: string;
  schedule: ClinicSchedule | null | undefined;
  initialDay?: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

function dayFromSchedule(
  dayName: string,
  workingDays: ClinicWorkingDay[] | undefined
): { isOpen: boolean; hours: Array<{ start: string; end: string }> } {
  const found = workingDays?.find((w) => w.day === dayName);
  if (!found) {
    return { isOpen: false, hours: [] };
  }
  return {
    isOpen: found.isOpen,
    hours: (found.hours ?? []).map((h) => ({
      start: h.start ?? '09:00',
      end: h.end ?? '17:00',
    })),
  };
}

export const EditDayScheduleModal = ({
  open,
  clinicId,
  schedule,
  initialDay,
  onClose,
  onSaved,
}: EditDayScheduleModalProps) => {
  const [day, setDay] = useState<string>('Monday');
  const [isOpenDay, setIsOpenDay] = useState(true);
  const [slots, setSlots] = useState<Array<{ start: string; end: string }>>([{ start: '09:00', end: '17:00' }]);
  const { showError } = useToast();
  const { addScheduleAsync, isPending: isSubmitting } = useAddClinicScheduleMutation(clinicId);

  const applyDayFromSchedule = useCallback(
    (dayName: string) => {
      const wd = schedule?.workingDays;
      const { isOpen, hours } = dayFromSchedule(dayName, wd);
      setDay(dayName);
      setIsOpenDay(isOpen);
      if (isOpen && hours.length > 0) {
        setSlots(hours);
      } else if (isOpen && hours.length === 0) {
        setSlots([{ start: '09:00', end: '17:00' }]);
      } else {
        setSlots([]);
      }
    },
    [schedule]
  );

  useEffect(() => {
    if (!open) return;
    const startDay = initialDay && WEEKDAYS.includes(initialDay) ? initialDay : 'Monday';
    applyDayFromSchedule(startDay);
  }, [open, initialDay, applyDayFromSchedule]);

  const addSlot = () => {
    setSlots((prev) => [...prev, { start: '09:00', end: '17:00' }]);
  };

  const removeSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: 'start' | 'end', value: string) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpenDay && slots.length === 0) {
      showError('Add at least one time slot, or mark the day as closed.', 'Invalid hours');
      return;
    }
    if (isOpenDay && slots.some((s) => !s.start || !s.end)) {
      showError('Each slot needs start and end time.', 'Invalid hours');
      return;
    }

    try {
      const hours = isOpenDay
        ? slots.map((s) => ({
            startMinutes: to24hString(s.start),
            endMinutes: to24hString(s.end),
          }))
        : [];

      await addScheduleAsync({
        workingDays: [
          {
            day,
            isOpen: isOpenDay,
            hours,
          },
        ],
      });

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Failed to save schedule:', err);
    }
  };

  if (!open) return null;

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_SCROLL_CLASS}>
        <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit day</h2>
            <p className="mt-1 text-sm text-gray-500">
              Change hours for one weekday. Closed days have no time slots. Times use 24h input; preview shows 12h.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2.5 hover:bg-gray-100 text-gray-500 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">Day</label>
            <select
              value={day}
              onChange={(e) => applyDayFromSchedule(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white"
            >
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between border rounded-lg border-gray-200 bg-gray-50 px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Open this day</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpenDay((prev) => {
                  const next = !prev;
                  if (next && slots.length === 0) {
                    setSlots([{ start: '09:00', end: '17:00' }]);
                  }
                  return next;
                });
              }}
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

          {isOpenDay && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-700">Time slots</p>
              {slots.map((slot, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-3 bg-gray-50/80"
                >
                  <input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateSlot(idx, 'start', e.target.value)}
                    className="rounded-xl border border-gray-300 px-2 py-1.5 text-sm flex-1 min-w-[7rem]"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateSlot(idx, 'end', e.target.value)}
                    className="rounded-xl border border-gray-300 px-2 py-1.5 text-sm flex-1 min-w-[7rem]"
                  />
                  <span className="text-[11px] text-gray-500 w-full sm:w-auto">
                    {formatTime24To12(slot.start)} – {formatTime24To12(slot.end)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSlot(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 ml-auto"
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
            <p className="text-xs text-gray-500 italic">
              This day will be saved as closed (no operating hours).
            </p>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 pt-4 border-t border-gray-100 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                'Save day'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
