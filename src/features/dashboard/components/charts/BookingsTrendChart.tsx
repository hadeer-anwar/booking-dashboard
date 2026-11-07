// components/dashboard/charts/BookingsTrendChart.tsx
'use client';

import { Area, CartesianGrid, Line, Tooltip, XAxis, YAxis, ComposedChart, ResponsiveContainer } from 'recharts';
import { CHART_TOOLTIP } from './chart-config';

interface BookingsTrendChartProps {
  data: Array<{ date: string; bookings: number }>;
  growth: number;
}

export function BookingsTrendChart({ data, growth }: BookingsTrendChartProps) {
  const formattedData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bookings: item.bookings,
  }));

  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Bookings Over Time</h2>
          <p className="mt-1 text-sm text-gray-500">Weekly booking trend</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-800">
            +{growth}% growth
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Area Chart
          </span>
        </div>
      </div>
      <div className="h-[280px] w-full min-h-[240px]">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formattedData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f485a3" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f485a3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5efec" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8f827e' }} tickLine={false} axisLine={{ stroke: '#e8e0dc' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8f827e' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="bookings" stroke="#f485a3" strokeWidth={2} fill="url(#fillBookings)" name="Bookings" />
              <Line type="monotone" dataKey="bookings" stroke="#f485a3" strokeWidth={2} dot={{ fill: '#f485a3', strokeWidth: 2 }} name="Trend Line" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No booking data available</div>
        )}
      </div>
    </div>
  );
}