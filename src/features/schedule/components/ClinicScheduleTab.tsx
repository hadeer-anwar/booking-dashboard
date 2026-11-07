'use client';

import { useState } from 'react';
import { Clock, Edit2, Calendar, Activity } from 'lucide-react';
import { EditDayScheduleModal } from '@/src/features/schedule/components/EditDayScheduleModal';
import { EditScheduleModal } from '@/src/features/schedule/components/EditScheduleModal';
import { formatTime24To12 } from '@/src/utils/helpers';
import type { Clinic } from '@/src/features/clinics/types/types';
import type { ClinicScheduleHour } from '@/src/features/schedule/types/types';

const WEEK_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ClinicScheduleTabProps {
  clinic: Clinic;
  clinicId: string;
  onSaved: () => void | Promise<void>;
}

export function ClinicScheduleTab({ clinic, clinicId, onSaved }: ClinicScheduleTabProps) {
  const [editDayOpen, setEditDayOpen] = useState(false);
  const [editDayInitial, setEditDayInitial] = useState<string | null>(null);
  const [editFullOpen, setEditFullOpen] = useState(false);

  const allDays = [...(clinic.schedule?.workingDays ?? [])].sort(
    (a, b) => WEEK_ORDER.indexOf(a.day) - WEEK_ORDER.indexOf(b.day)
  );
  const days = allDays.filter((d) => d.isOpen);
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = days.find((d) => d.day === todayName);

  return (
    <div className="space-y-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Weekly Schedule</h2>
          <p className="mt-1 text-xs text-gray-500">Clinic operating hours and availability</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditDayInitial(null);
              setEditDayOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
          >
            <Edit2 className="h-4 w-4" />
            Edit day
          </button>
          <button
            type="button"
            onClick={() => setEditFullOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 transition-all"
          >
            Edit full schedule
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {days.length ? (
          <>
            {/* Column headers only make sense once the row itself is a real
                12-col grid — hidden below sm: where rows switch to a
                stacked mobile layout instead. */}
            <div className="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-gray-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 sm:grid">
              <div className="col-span-3">Day</div>
              <div className="col-span-8">Operating Hours</div>
              <div className="col-span-1 text-right">Edit</div>
            </div>
            {days.map((day) => (
              <div
                key={day.day}
                className="grid grid-cols-1 gap-2 border-b border-gray-200 px-4 py-3 last:border-b-0 hover:bg-gray-50 transition-colors sm:grid-cols-12 sm:items-center sm:gap-4"
              >
                <div className="col-span-3 flex items-center justify-between gap-2 sm:justify-start">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-gray-900">{day.day}</span>
                  </div>
                  {/* Same edit action, shown here on mobile (paired with the
                      day name) and hidden once its own column reappears at sm:. */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditDayInitial(day.day);
                      setEditDayOpen(true);
                    }}
                    aria-label={`Edit ${day.day} hours`}
                    className="rounded-lg p-2.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors sm:hidden"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="col-span-8">
                  {day.hours?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {day.hours.map((h: ClinicScheduleHour, idx: number) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm"
                        >
                          <span className="font-medium text-gray-900">{formatTime24To12(h.start)}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-gray-900">{formatTime24To12(h.end)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm italic text-gray-400">No hours set</span>
                  )}
                </div>
                <div className="col-span-1 hidden justify-end sm:flex">
                  <button
                    type="button"
                    onClick={() => {
                      setEditDayInitial(day.day);
                      setEditDayOpen(true);
                    }}
                    aria-label={`Edit ${day.day} hours`}
                    className="rounded-lg p-2.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span>
                  <span className="font-medium text-gray-900">{days.length}</span> operating days
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 py-12 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gray-100 p-3">
              <Clock className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-gray-900">No schedule configured</h3>
            <p className="mx-auto mb-4 max-w-sm text-xs text-gray-500">
              Set up your clinic&apos;s working hours to help patients know when you&apos;re available.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditDayInitial(null);
                  setEditDayOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
              >
                <Edit2 className="h-4 w-4" /> Edit day
              </button>
              <button
                type="button"
                onClick={() => setEditFullOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Edit full schedule
              </button>
            </div>
          </div>
        )}
      </div>

      {todaySchedule?.isOpen && todaySchedule.hours?.length ? (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <Activity className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-medium">Today&apos;s hours:</span>
            <span className="text-gray-900">
              {todaySchedule.hours
                .map((h: ClinicScheduleHour) => `${formatTime24To12(h.start)} – ${formatTime24To12(h.end)}`)
                .join(', ')}
            </span>
          </div>
          <span className="font-medium text-emerald-600">Open now</span>
        </div>
      ) : null}

      <EditDayScheduleModal
        open={editDayOpen}
        clinicId={clinicId}
        schedule={clinic.schedule}
        initialDay={editDayInitial}
        onClose={() => {
          setEditDayOpen(false);
          setEditDayInitial(null);
        }}
        onSaved={onSaved}
      />
      <EditScheduleModal
        open={editFullOpen}
        clinicId={clinicId}
        schedule={clinic.schedule}
        onClose={() => setEditFullOpen(false)}
        onSaved={onSaved}
      />
    </div>
  );
}
