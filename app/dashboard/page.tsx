// app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { LayoutGrid, CalendarRange, X } from 'lucide-react';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { isClinicManagerRole, ROLE_LABELS } from '@/src/types';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { ClinicAdminDashboard } from '@/src/features/dashboard/components/ClinicAdminDashboard';
import { SuperAdminDashboard } from '@/src/features/dashboard/components/SuperAdminDashboard';
import { useClinicDashboard } from '@/src/features/dashboard/hooks/useClinicDashboard';
import { useSuperDashboard } from '@/src/features/dashboard/hooks/useSuperDashboard';

/** "YYYY-MM-DD" string → Date at local midnight, or null. */
function toDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "YYYY-MM-DD" for the 1st of the current month, in local time. */
function startOfCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const isClinicAdmin = isClinicManagerRole(user?.role);
  const isSuperAdmin = user?.role === 'super_admin';
  const [dateFrom, setDateFrom] = useState(startOfCurrentMonth);
  const [dateTo, setDateTo] = useState('');

  const hasRange = !!dateFrom || !!dateTo;

  const { data: clinicData, isLoading: isClinicLoading } = useClinicDashboard({
    clinicId: isClinicAdmin ? user?.clinicId ?? '' : '',
    from: toDate(dateFrom),
    to: toDate(dateTo),
  });

  const { data: superAdminData, isLoading: isSuperAdminLoading } = useSuperDashboard(
    isSuperAdmin ? { from: toDate(dateFrom), to: toDate(dateTo) } : undefined
  );

  const clinicName = clinicData?.clinicData?.name;
  const subtitle = isClinicAdmin
    ? `${clinicName ? clinicName + ' — ' : ''}overview and metrics for your clinic.`
    : user?.fullName
      ? `Signed in as ${user.fullName}. Platform-wide overview.`
      : 'Platform-wide overview.';

  return (
    <div className="px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <DashboardPageHeader
          icon={LayoutGrid}
          title="Dashboard"
          description={subtitle}
          badge={
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {user?.role ? ROLE_LABELS[user.role] : 'Super Admin'}
            </span>
          }
        />

        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 flex-1 truncate text-sm text-gray-600">
            Signed in as{' '}
            <span className="font-medium text-gray-900">{user?.fullName ?? '—'}</span>
            <span className="text-gray-400"> · </span>
            <span className="text-gray-500">Role</span>{' '}
            <span className="font-medium text-gray-900">{user?.role ?? '—'}</span>
          </p>

          {/* Date range — same pill style as AppointmentsToolbar. flex-wrap is
              a safety net (not the primary fix): with two date inputs, an
              arrow, and a clear button all shrink-0, this pill's own content
              can exceed a narrow phone's width even after the outer row
              stacks — better to wrap onto a second line than clip. */}
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-2 shadow-sm shrink-0">
            <CalendarRange className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="w-28 bg-transparent outline-none text-sm text-gray-700 cursor-pointer sm:w-32"
              title="From date"
            />
            <span className="text-gray-300 text-xs select-none">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="w-28 bg-transparent outline-none text-sm text-gray-700 cursor-pointer sm:w-32"
              title="To date"
            />
            {hasRange && (
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="ml-1 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {isClinicAdmin && clinicData && (
          <ClinicAdminDashboard
            data={clinicData}
            clinicName={clinicData.clinicData?.name}
            isLoading={isClinicLoading}
          />
        )}

        {isSuperAdmin && superAdminData && (
          <SuperAdminDashboard
            data={superAdminData}
            isLoading={isSuperAdminLoading}
          />
        )}
      </div>
    </div>
  );
}
