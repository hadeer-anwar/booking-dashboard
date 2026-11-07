'use client';

import type { ConflictAppointment } from '../types/types';

/**
 * Shared between BlockedPeriodConflictsModal (reactive, after a create/update
 * 409) and CheckConflictsModal (proactive, run on demand before submitting)
 * — both render the exact same conflicting-appointment rows, just with
 * different surrounding chrome/actions.
 */
export function ConflictAppointmentsList({ appointments }: { appointments: ConflictAppointment[] }) {
  if (appointments.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400">No conflict details available.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {appointments.map((a) => (
        <li key={a.id} className="py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-gray-900">
              {a.date} · {a.start}–{a.end}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-600">
              {a.status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            {a.customer && <span>Customer: {a.customer.name}</span>}
            {a.provider && <span>Provider: {a.provider.name}</span>}
            {a.service && <span>Service: {a.service.name}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
