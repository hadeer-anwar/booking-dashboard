'use client';

import {
  CalendarCheck,
  Percent,
  TrendingDown,
  Clock,
  Star,
  DollarSign,
} from 'lucide-react';
import { KpiCard } from './charts/KpiCard';
import { BookingsTrendChart } from './charts/BookingsTrendChart';
import { StatusDistributionChart } from './charts/StatusDistributionChart';
import { WeeklyPerformanceChart } from './charts/WeeklyPerformanceChart';
import { TopServicesList } from './charts/TopServicesList';
import { TopProvidersList } from './charts/TopProvidersList';
import { RevenueTrendChart } from './charts/RevenueTrendChart';
import { InsightsSummary } from './charts/InsightsSummary';
import { BookingHeatmapCalendar } from './charts/BookingHeatmapCalendar';
import { DashboardData } from '../types/types';
import { LoadingState } from '@/src/components/ui/LoadingState';

interface ClinicAdminDashboardProps {
  data: DashboardData;
  clinicName?: string;
  isLoading: boolean;
}

export function ClinicAdminDashboard({ data, clinicName, isLoading }: ClinicAdminDashboardProps) {
  const scopeLabel = clinicName || 'This clinic';

  const completionRate = data.overview.totalBookings > 0
    ? Math.round((data.overview.completed / data.overview.totalBookings) * 100)
    : 0;

  const cancellationRate = data.overview.totalBookings > 0
    ? Math.round((data.overview.cancelled / data.overview.totalBookings) * 100)
    : 0;

  const noShowRate = data.overview.totalBookings > 0
    ? Math.round((data.overview.noShow / data.overview.totalBookings) * 100)
    : 0;

  const bookingGrowth = data.bookingsTrend.length >= 2
    ? Math.round(((data.bookingsTrend[data.bookingsTrend.length - 1].count - data.bookingsTrend[0].count) / data.bookingsTrend[0].count) * 100)
    : 0;

  const daysOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const grouped: Record<string, { total: number; count: number }> = {
    Sun: { total: 0, count: 0 },
    Mon: { total: 0, count: 0 },
    Tue: { total: 0, count: 0 },
    Wed: { total: 0, count: 0 },
    Thu: { total: 0, count: 0 },
    Fri: { total: 0, count: 0 },
    Sat: { total: 0, count: 0 },
  };
  
  data.bookingsTrend.forEach(item => {
    const date = new Date(item.date);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    grouped[day].total += item.count;
    grouped[day].count += 1;
  });
  
  const weeklyPerformance = daysOrder.map(day => ({
    day,
    bookings: grouped[day].count > 0 ? Math.round(grouped[day].total / grouped[day].count) : 0,
  }));



  if (isLoading) {
    return <LoadingState message="Loading dashboard data..." page />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total Bookings"
          value={data.overview.totalBookings}
          hint={scopeLabel}
          icon={CalendarCheck}
          accent="brand"
          trend={{ value: bookingGrowth, isPositive: bookingGrowth >= 0 }}
        />
        <KpiCard
          label="Completion Rate"
          value={`${completionRate}%`}
          hint={`${data.overview.completed} completed`}
          icon={Percent}
          accent="gold"
        />
        <KpiCard
          label="Cancellation Rate"
          value={`${cancellationRate}%`}
          hint={`${data.overview.cancelled} cancelled`}
          icon={TrendingDown}
          accent="tan"
        />
        <KpiCard
          label="No-Show Rate"
          value={`${noShowRate}%`}
          hint={`${data.overview.noShow} no-shows`}
          icon={Clock}
          accent="neutral"
        />
        <KpiCard
          label="Avg Rating"
          value={data.ratings.avgRating.toFixed(1)}
          hint={`${data.ratings.totalReviews} reviews`}
          icon={Star}
          accent="brand"
        />
        <KpiCard
          label="Revenue"
          value={`${data.revenue.toLocaleString()} EGP`}
          hint="Total revenue"
          icon={DollarSign}
          accent="gold"
        />
      </div>

      {/* Main charts row. Explicit fr ratio rather than a 3-col grid with a
          col-span-2 child: the status donut + its legend need more than a
          third of the row to sit side by side without the ring clipping. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
        <BookingsTrendChart data={data.bookingsTrend.map(item => ({ date: item.date, bookings: item.count }))} growth={bookingGrowth} />
        <StatusDistributionChart data={data.statusDistribution} />
      </div>

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeeklyPerformanceChart data={weeklyPerformance} />
        <BookingHeatmapCalendar data={data.bookingsTrend} />

      </div>


      {/* Top Services & Providers Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopServicesList services={data.topServices} />
        <TopProvidersList providers={data.topProviders} />
      </div>


      {/* Revenue Trend & Key Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueTrendChart data={data.revenueTrend} />
        <InsightsSummary
          bookingGrowth={bookingGrowth}
          completionRate={completionRate}
          avgRating={data.ratings.avgRating}
        />
      </div>

      <p className="text-center text-xs text-gray-400">
        Data is real-time from your clinic analytics • Last updated: {new Date().toLocaleString()}
      </p>
    </div>
  );
}