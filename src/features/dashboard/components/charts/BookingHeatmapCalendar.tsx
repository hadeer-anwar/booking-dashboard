// features/dashboard/components/charts/BookingHeatmapCalendar.tsx
'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface BookingHeatmapCalendarProps {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export function BookingHeatmapCalendar({ data }: BookingHeatmapCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-gray-900">Booking Heatmap</h2>
            <p className="mt-1 text-sm text-gray-500">Daily activity intensity</p>
          </div>
          <Calendar className="h-4 w-4 text-gray-300" />
        </div>
        <div className="flex h-64 items-center justify-center text-gray-400">
          No booking data available
        </div>
      </div>
    );
  }

  // Create a map of date to booking count
  const bookingMap = new Map();
  data.forEach(item => {
    bookingMap.set(item.date, item.count);
  });

  // Get days in month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  
  // Array of day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get max bookings for color scaling
  const maxBookings = Math.max(...data.map(d => d.count), 1);

  const getColorIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-50';
    const intensity = Math.min(count / maxBookings, 1);
    if (intensity < 0.25) return 'bg-brand-100';
    if (intensity < 0.5) return 'bg-brand-200';
    if (intensity < 0.75) return 'bg-brand-300';
    return 'bg-brand-400 text-gray-900';
  };

  const getBookingCountForDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookingMap.get(dateStr) || 0;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Booking Heatmap</h2>
          <p className="mt-1 text-sm text-gray-500">Daily booking intensity</p>
        </div>
        <Calendar className="h-4 w-4 text-gray-300" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <select
          value={viewMonth}
          onChange={(e) => setViewMonth(parseInt(e.target.value))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(today.getFullYear(), i, 1).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={viewYear}
          onChange={(e) => setViewYear(parseInt(e.target.value))}
          className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="h-10 rounded-md" />
        ))}
        
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const bookingCount = getBookingCountForDay(day);
          return (
            <div
              key={day}
              className={`h-10 rounded-md flex items-center justify-center text-xs font-medium transition-all hover:scale-105 cursor-pointer ${getColorIntensity(bookingCount)}`}
              title={`${bookingCount} bookings on ${day}/${viewMonth + 1}/${viewYear}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-brand-100" />
          <span className="text-gray-500">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-brand-200" />
          <span className="text-gray-500">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-brand-400" />
          <span className="text-gray-500">High</span>
        </div>
      </div>
    </div>
  );
}