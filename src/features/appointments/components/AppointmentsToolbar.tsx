'use client';

import { Plus, Search, CalendarRange, X } from 'lucide-react';
import type { AppointmentStatus } from '../types/types';

const STATUS_TABS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending Assignment', value: 'pending_assignment' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

interface AppointmentsToolbarProps {
  activeStatus: AppointmentStatus | 'all';
  onStatusChange: (status: AppointmentStatus | 'all') => void;
  search: string;
  onSearchChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onAddAppointment?: () => void;
  total?: number;
}

export const AppointmentsToolbar = ({
  activeStatus,
  onStatusChange,
  search,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onAddAppointment,
  total,
}: AppointmentsToolbarProps) => {
  const hasDateFilter = !!dateFrom || !!dateTo;

  const clearDates = () => {
    onDateFromChange('');
    onDateToChange('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage clinic appointments{total !== undefined ? ` · ${total} total` : ''}
          </p>
        </div>
        {onAddAppointment && (
          <button
            type="button"
            onClick={onAddAppointment}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Book Appointment</span>
          </button>
        )}
      </div>

      {/* Search + Date range */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="flex items-center flex-1 rounded-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-500 shadow-sm">
          <Search className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by customer phone…"
            className="w-full bg-transparent outline-none placeholder:text-gray-400 text-sm"
          />
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-2 shadow-sm shrink-0">
          <CalendarRange className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            max={dateTo || undefined}
            className="bg-transparent outline-none text-sm text-gray-700 w-32 cursor-pointer"
            title="From date"
          />
          <span className="text-gray-300 text-xs select-none">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            min={dateFrom || undefined}
            className="bg-transparent outline-none text-sm text-gray-700 w-32 cursor-pointer"
            title="To date"
          />
          {hasDateFilter && (
            <button
              type="button"
              onClick={clearDates}
              className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear date filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onStatusChange(tab.value)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeStatus === tab.value
                ? 'border-brand-400 bg-brand-400 text-gray-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
