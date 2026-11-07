// components/dashboard/charts/KpiCard.tsx
'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ComponentType } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  /**
   * Warm accent family (rose/gold/tan/neutral) instead of a semantic
   * traffic-light palette — every KPI card uses the same restrained accent
   * language regardless of whether the metric itself is "good" or "bad",
   * matching the reference dashboard's design (see app/globals.css for the
   * brand/tan/gold tokens).
   */
  accent: 'brand' | 'gold' | 'tan' | 'neutral';
  trend?: { value: number; isPositive: boolean };
}

export function KpiCard({ label, value, hint, icon: Icon, accent, trend }: KpiCardProps) {
  const ringMap = {
    brand: 'group-hover:border-brand-200',
    gold: 'group-hover:border-gold-100',
    tan: 'group-hover:border-tan-100',
    neutral: 'group-hover:border-gray-300',
  };
  const iconBgMap = {
    brand: 'bg-brand-100 group-hover:bg-brand-400',
    gold: 'bg-gold-100 group-hover:bg-gold-400',
    tan: 'bg-tan-100 group-hover:bg-tan-400',
    neutral: 'bg-gray-100 group-hover:bg-gray-900',
  };
  const iconClassMap = {
    brand: 'text-brand-800 group-hover:text-gray-900',
    gold: 'text-gold-700 group-hover:text-gray-900',
    tan: 'text-tan-700 group-hover:text-gray-900',
    neutral: 'text-gray-600 group-hover:text-white',
  };

  const ring = ringMap[accent];
  const iconBg = iconBgMap[accent];
  const iconClass = iconClassMap[accent];

  return (
    <div className={`group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${ring}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${iconBg}`}>
        <Icon className={`h-4.5 w-4.5 transition-colors ${iconClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <p className="truncate font-heading text-xl text-gray-900">{value}</p>
          {trend && (
            <div className={`flex shrink-0 items-center gap-0.5 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-400">{hint}</p>
      </div>
    </div>
  );
}