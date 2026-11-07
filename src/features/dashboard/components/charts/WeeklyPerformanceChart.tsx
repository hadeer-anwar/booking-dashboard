// components/dashboard/charts/WeeklyPerformanceChart.tsx
'use client';

import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import { CHART_TOOLTIP, STATUS_COLORS } from './chart-config';

interface WeeklyPerformanceChartProps {
  data: Array<{ day: string; bookings: number }>;
}

// Reuses the exact hex values StatusDistributionChart's pie slices are
// colored with (chart-config.ts's STATUS_COLORS) — a "high" day maps to the
// same tan as "completed", "medium" to the same rose as "confirmed", and
// "low" to the same gray as "cancelled", so the two charts on this dashboard
// read as one consistent palette instead of two unrelated ones that happen
// to look similar.
const HIGH_COLOR = STATUS_COLORS.completed;
const MEDIUM_COLOR = STATUS_COLORS.confirmed;
const LOW_COLOR = STATUS_COLORS.cancelled;

const LOW_MAX = 5;
const HIGH_MIN = 21;

const colorFor = (bookings: number) => (bookings >= HIGH_MIN ? HIGH_COLOR : bookings <= LOW_MAX ? LOW_COLOR : MEDIUM_COLOR);

export function WeeklyPerformanceChart({ data }: WeeklyPerformanceChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Weekly Performance</h2>
          <p className="mt-1 text-sm text-gray-500">Bookings by day of week</p>
        </div>
        <Calendar className="h-4 w-4 text-gray-300" />
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5efec" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8f827e' }} />
            <YAxis tick={{ fontSize: 11, fill: '#8f827e' }} allowDecimals={false} />
            <Tooltip {...CHART_TOOLTIP} />
            <Bar dataKey="bookings" fill={MEDIUM_COLOR} radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={colorFor(entry.bookings)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: HIGH_COLOR }}></div>
          <span className="text-gray-500">High (&gt;20)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: MEDIUM_COLOR }}></div>
          <span className="text-gray-500">Medium (6-20)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: LOW_COLOR }}></div>
          <span className="text-gray-500">Low (&le;5)</span>
        </div>
      </div>
    </div>
  );
}