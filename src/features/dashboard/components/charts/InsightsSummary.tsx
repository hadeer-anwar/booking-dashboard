// components/dashboard/charts/InsightsSummary.tsx
'use client';

import { TrendingUp } from 'lucide-react';

interface InsightsSummaryProps {
  bookingGrowth: number;
  completionRate: number;
  avgRating: number;
}

export function InsightsSummary({ bookingGrowth, completionRate, avgRating }: InsightsSummaryProps) {
  const items = [
    { key: 'growth', dot: 'bg-brand-400', value: `${bookingGrowth}%`, label: 'booking growth' },
    { key: 'completion', dot: 'bg-tan-400', value: `${completionRate}%`, label: 'completion rate' },
    { key: 'rating', dot: 'bg-gold-400', value: `${avgRating.toFixed(1)}★`, label: 'average rating' },
  ];

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <TrendingUp className="h-4 w-4 text-gray-700" />
        </div>
        <h3 className="font-heading text-xl text-gray-900">Key Insights</h3>
      </div>

      <div className="flex flex-1 flex-col justify-center divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-3 px-1 py-2.5">
            <div className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
            <span className="text-sm text-gray-600">
              <strong className="text-gray-900">{item.value}</strong> {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
