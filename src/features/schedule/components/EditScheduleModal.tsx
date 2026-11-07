'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { ClinicSchedule, ClinicWorkingDay } from '@/src/features/schedule/types/types';
import { useUpdateClinicScheduleMutation } from '@/src/features/schedule/hooks/useSchedule';
import { useToast } from '@/src/components/ui/ToastProvider';
import { formatTime24To12, to24hString } from '@/src/utils/helpers';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface EditScheduleModalProps {
  open: boolean;
  clinicId: string;
  schedule: ClinicSchedule | null | undefined;
  onClose: () => void;
  onSaved?: () => void;
}

type DayState = {
  day: string;
  isOpen: boolean;
  hours: Array<{ start: string; end: string }>;
};

function defaultDay(day: string): DayState {
  return { day, isOpen: false, hours: [] };
}

function scheduleToDayState(wd: ClinicWorkingDay): DayState {
  return {
    day: wd.day,
    isOpen: wd.isOpen,
    hours: (wd.hours ?? []).map((h) => ({ start: h.start ?? '09:00', end: h.end ?? '17:00' })),
  };
}

export const EditScheduleModal = ({
  open,
  clinicId,
  schedule,
  onClose,
  onSaved,
}: EditScheduleModalProps) => {
  const [days, setDays] = useState<DayState[]>(() => WEEKDAYS.map((d) => defaultDay(d)));
  const { showError } = useToast();
  const { updateScheduleAsync, isPending: isSubmitting } = useUpdateClinicScheduleMutation(clinicId);

  useEffect(() => {
    if (!open) return;
    const existingByDay = new Map(
      (schedule?.workingDays ?? []).map((wd) => [wd.day, scheduleToDayState(wd)])
    );
    setDays(WEEKDAYS.map((d) => existingByDay.get(d) ?? defaultDay(d)));
  }, [open, schedule]);

  if (!open) return null;

  const setDay = (dayIndex: number, updater: (prev: DayState) => DayState) => {
    setDays((prev) => prev.map((d, i) => (i === dayIndex ? updater(d) : d)));
  };

  const addSlot = (dayIndex: number) => {
    setDay(dayIndex, (d) => ({
      ...d,
      hours: [...d.hours, { start: '09:00', end: '17:00' }],
    }));
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    setDay(dayIndex, (d) => ({
      ...d,
      hours: d.hours.filter((_, i) => i !== slotIndex),
    }));
  };

  const updateSlot = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    setDay(dayIndex, (d) => ({
      ...d,
      hours: d.hours.map((h, i) => (i === slotIndex ? { ...h, [field]: value } : h)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const openDays = days.filter((d) => d.isOpen);
    const hasInvalidHours = openDays.some(
      (d) => d.hours.length === 0 || d.hours.some((h) => !h.start || !h.end)
    );
    if (hasInvalidHours) {
      showError('Open days must have at least one time slot with start and end.', 'Invalid schedule');
      return;
    }

    try {
      await updateScheduleAsync({
        workingDays: days.map((d) => ({
          day: d.day,
          isOpen: d.isOpen,
          hours: d.isOpen
            ? d.hours.map((h) => ({
                startMinutes: to24hString(h.start),
                endMinutes: to24hString(h.end),
              }))
            : [],
        })),
      });

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Failed to update schedule:', err);
    }
  };

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_CLASS}>
        <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit schedule</h2>
            <p className="mt-1 text-sm text-gray-500">
              Set hours per day (shown in 12h). Closed days: turn off &quot;Open&quot;. Times are sent as 24h to the
              server.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2.5 hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1">
            {days.map((dayState, dayIndex) => (
              <div
                key={dayState.day}
                className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{dayState.day}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-gray-600">Open</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={dayState.isOpen}
                      onClick={() =>
                        setDay(dayIndex, (d) => ({
                          ...d,
                          isOpen: !d.isOpen,
                          hours: d.isOpen ? d.hours : d.hours.length ? d.hours : [{ start: '09:00', end: '17:00' }],
                        }))
                      }
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
                {dayState.isOpen && (
                  <div className="space-y-2">
                    {dayState.hours.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center gap-2 flex-wrap">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateSlot(dayIndex, slotIndex, 'start', e.target.value)}
                          className="rounded-xl border border-gray-300 px-2 py-1.5 text-sm"
                        />
                        <span className="text-gray-400 text-sm">–</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateSlot(dayIndex, slotIndex, 'end', e.target.value)}
                          className="rounded-xl border border-gray-300 px-2 py-1.5 text-sm"
                        />
                        <span className="text-xs text-gray-500">
                          {formatTime24To12(slot.start)} – {formatTime24To12(slot.end)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSlot(dayIndex, slotIndex)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
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
                {!dayState.isOpen && <p className="text-xs text-gray-500 italic">Closed</p>}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex flex-col-reverse justify-end gap-3 shrink-0 sm:flex-row">
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
                'Save schedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
