// features/dashboard/components/SuperAdminDashboard.tsx
'use client';

import {
  Building2,
  TrendingUp,
  Users,
  CalendarCheck,
  DollarSign,
  Activity,
} from 'lucide-react';
import { KpiCard } from './charts/KpiCard';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { SuperAdminData } from '../types/types';

interface SuperAdminDashboardProps {
  data: SuperAdminData;
  isLoading: boolean;
}

export function SuperAdminDashboard({ data, isLoading }: SuperAdminDashboardProps) {


  if (isLoading) {
    return <LoadingState message="Loading platform analytics..." page />;
  }

  return (
    <div className="space-y-6">
      {/* Super Admin KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Clinics"
          value={data.totalClinics}
          hint="Active clinics on platform"
          icon={Building2}
          accent="brand"
          trend={{ value: 12, isPositive: true }}
        />
        <KpiCard
          label="Total Bookings"
          value={data.totalBookings.toLocaleString()}
          hint="Across all clinics"
          icon={CalendarCheck}
          accent="gold"
          trend={{ value: 8, isPositive: true }}
        />
        <KpiCard
          label="Total Revenue"
          value={`${data.totalRevenue.toLocaleString()} EGP`}
          hint="Platform revenue"
          icon={DollarSign}
          accent="tan"
          trend={{ value: 15, isPositive: true }}
        />
        <KpiCard
          label="Active Users"
          value={data.activeUsers.toLocaleString()}
          hint="Monthly active users"
          icon={Users}
          accent="neutral"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Placeholder for Super Admin specific charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl text-gray-900">Clinic Growth</h2>
              <p className="mt-1 text-sm text-gray-500">New clinics over time</p>
            </div>
            <TrendingUp className="h-4 w-4 text-gray-300" />
          </div>
          <div className="flex h-64 items-center justify-center text-gray-400">
            Clinic growth chart coming soon
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl text-gray-900">Top Performing Clinics</h2>
              <p className="mt-1 text-sm text-gray-500">By bookings and revenue</p>
            </div>
            <Activity className="h-4 w-4 text-gray-300" />
          </div>
          <div className="space-y-3">
            {data.topClinics.map((clinic, idx) => (
              <div key={clinic.name} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-6 h-6 shrink-0 rounded-full bg-linear-to-br from-brand-400 to-brand-600 flex items-center justify-center text-gray-900 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{clinic.name}</p>
                    <p className="text-xs text-gray-500">{clinic.bookings} bookings</p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-gray-900">{clinic.revenue.toLocaleString()} EGP</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Platform-wide analytics • Last updated: {new Date().toLocaleString()}
      </p>
    </div>
  );
}