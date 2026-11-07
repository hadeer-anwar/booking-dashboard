// components/dashboard/charts/StatusDistributionChart.tsx
'use client';

import { Cell, Pie, PieChart, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { CHART_TOOLTIP, STATUS_COLORS, STATUS_LABELS } from './chart-config';

interface StatusDistributionChartProps {
  data: Array<{ status: string; count: number }>;
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const slices = data.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    color: STATUS_COLORS[item.status] || '#b3a7a2',
    percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }));

  // Surfaced in the callout below. Derived from the same `data` the donut
  // renders — no extra request, and it stays accurate for whatever date range
  // the dashboard is currently scoped to.
  const pendingCount = data.find((item) => item.status === 'pending')?.count ?? 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Booking status</h2>
          <p className="mt-1 text-sm text-gray-500">Appointment mix</p>
        </div>
        <BarChart3 className="h-4 w-4 text-gray-300" aria-hidden />
      </div>

      {total > 0 ? (
        <>
          {/* The donut is shrink-0 and the legend is flex-basis'd, so when the
              card gets too narrow for both the legend wraps underneath rather
              than squeezing the ring until it clips. */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-5">
            {/* Donut + centred total. The total sits in an overlay rather than
                a Recharts label so it can use the display face and its own
                two-line layout; pointer-events-none keeps slice hover/tooltip
                working underneath it. */}
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    // Percentages of the container's own measured size, not
                    // fixed pixel numbers — globals.css shrinks the root
                    // font-size at 1280–1919px viewport widths (a density
                    // trick for common desktop screens), which shrinks this
                    // wrapper's rem-based h-44/w-44 along with it. Fixed
                    // pixel radii tuned for the "normal" 176px box would then
                    // exceed the shrunk box and get clipped by the SVG's own
                    // bounds; percentages stay proportional at any box size.
                    innerRadius="68%"
                    outerRadius="90%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-3xl leading-none text-gray-900">{total}</span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  bookings
                </span>
              </div>
            </div>

            {/* Legend as a value list rather than Recharts' own inline legend —
                it pairs each status with its share, which the donut alone
                can't communicate precisely. Fixed (not flex-1/growing) so it
                stays a narrow column and leaves the donut above the room it
                needs, instead of stretching out to share the row evenly. */}
            <ul className="w-[130px] shrink-0 space-y-3 text-sm">
              {slices.map((slice) => (
                <li key={slice.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-gray-800">
                    <i
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                      aria-hidden
                    />
                    {slice.name}
                  </span>
                  <strong className="font-semibold text-gray-900">{slice.percent}%</strong>
                </li>
              ))}
            </ul>
          </div>

          {pendingCount > 0 && (
            <div className="mt-6 rounded-xl bg-gold-400/35 px-4 py-3 text-sm text-gray-900">
              <strong className="font-semibold">
                {pendingCount} booking{pendingCount === 1 ? '' : 's'}
              </strong>{' '}
              awaiting confirmation.
            </div>
          )}
        </>
      ) : (
        <div className="flex h-[220px] items-center justify-center text-gray-400">
          No status data available
        </div>
      )}
    </div>
  );
}
