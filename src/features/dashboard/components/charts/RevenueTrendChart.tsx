// components/dashboard/charts/RevenueTrendChart.tsx
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface RevenueTrendChartProps {
  data: Array<{ month: string; revenue: number }>;
}

// Matches the warm brand accent this dashboard uses everywhere else — an
// emphasis job: the month(s) that actually earned revenue carry the hue,
// empty months recede into gray.
const REVENUE_HUE = '#f485a3';
const EMPTY_HUE = '#e8e0dc';

function formatCurrency(value: number) {
  // The dashboard's currency is EGP (see the "Revenue" KpiCard right above
  // this chart) — the old chart mislabeled every value with "$".
  return `${Math.round(value).toLocaleString('en-US')} EGP`;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value);
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-lg">
      <p className="text-[11px] font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{formatCurrency(value)}</p>
    </div>
  );
}

// Only the peak bar gets a floating value — labelling every bar would be
// noise (marks-and-anatomy: label the extreme, never every point). Recharts
// calls this once per bar; returning null skips the label for that bar.
// Recharts' own `LabelContentType` signature is awkward to match exactly
// (x/y/value are typed as `string | number | ReactNode`, not plain numbers)
// — narrow it ourselves with `Number(...)` rather than fight its typing for
// what's an internal render helper, not a public API.
function makePeakLabel(data: Array<{ month: string; revenue: number }>, peakMonth: string | null) {
  // Recharts' own Props type for this callback has no index signature, so
  // nothing short of `any` structurally satisfies LabelContentType here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function PeakLabel(props: any) {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const value = Number(props.value ?? 0);
    const index = typeof props.index === 'number' ? props.index : null;
    if (!peakMonth || index == null || data[index]?.month !== peakMonth || value <= 0) return null;
    return (
      <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={11} fontWeight={600} fill="#241f20">
        {formatCompact(value)}
      </text>
    );
  };
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const hasRevenue = data.length > 0 && data.some((item) => item.revenue > 0);

  const { latest, growth, isPositive, peakMonth } = useMemo(() => {
    if (data.length === 0) return { latest: 0, growth: 0, isPositive: true, peakMonth: null as string | null };
    const latestPoint = data[data.length - 1];
    const previousPoint = data.length > 1 ? data[data.length - 2] : null;
    const growthPct =
      previousPoint && previousPoint.revenue > 0
        ? Math.round(((latestPoint.revenue - previousPoint.revenue) / previousPoint.revenue) * 100)
        : 0;
    const peak = data.reduce((best, item) => (item.revenue > best.revenue ? item : best), data[0]);
    return {
      latest: latestPoint.revenue,
      growth: growthPct,
      isPositive: growthPct >= 0,
      peakMonth: peak.revenue > 0 ? peak.month : null,
    };
  }, [data]);

  if (!hasRevenue) return null;

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Revenue Trend</h2>
          <p className="mt-1 text-sm text-gray-500">Monthly revenue analysis</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-base font-bold leading-tight text-gray-900">{formatCurrency(latest)}</p>
            <p className="text-[10px] text-gray-400">last month</p>
          </div>
          {data.length > 1 && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(growth)}%
            </span>
          )}
        </div>
      </div>

      <div className="h-[160px] min-h-[160px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 8, left: -16, bottom: 0 }} barCategoryGap="35%">
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#b3a7a2' }}
              tickLine={false}
              axisLine={{ stroke: '#e8e0dc' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#b3a7a2' }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={formatCompact}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'rgba(17, 24, 39, 0.04)' }} />
            <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((entry) => (
                <Cell key={entry.month} fill={entry.revenue > 0 ? REVENUE_HUE : EMPTY_HUE} />
              ))}
              <LabelList dataKey="revenue" content={makePeakLabel(data, peakMonth)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
