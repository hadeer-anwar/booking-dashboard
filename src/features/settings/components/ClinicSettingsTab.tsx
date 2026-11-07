'use client';

import { Clock, Calendar, RefreshCw, Shield, Users, Edit2 } from 'lucide-react';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { useClinicSettings } from '@/src/features/settings/hooks/useClinicSettings';
import { describeReleasePolicy, RELEASE_POLICY_LABELS } from '@/src/features/settings/utils/releasePolicy';
import type { ProviderSelectionPolicy } from '@/src/features/settings/types/types';

interface ClinicSettingsTabProps {
  clinicId: string;
  onEdit?: () => void;
}

const PROVIDER_SELECTION_POLICY_LABELS: Record<ProviderSelectionPolicy, string> = {
  customer_choice: 'Customers choose their provider',
  auto_assign: 'System auto-assigns a provider',
  staff_assign: 'Staff assigns a provider after booking',
};

// Static, fully-literal class strings per color — Tailwind's compiler scans
// source text for class names at build time and can't resolve a
// runtime-interpolated `bg-${color}-100`, so those classes can silently
// fail to generate (the icon losing its color/hover state, as if it
// "disappeared"). A lookup map keeps every class name literal.
const STAT_ICON_STYLES = {
  blue: { wrap: 'bg-blue-100 group-hover:bg-blue-600', icon: 'text-blue-600 group-hover:text-white' },
  purple: { wrap: 'bg-purple-100 group-hover:bg-purple-600', icon: 'text-purple-600 group-hover:text-white' },
  green: { wrap: 'bg-green-100 group-hover:bg-green-600', icon: 'text-green-600 group-hover:text-white' },
  orange: { wrap: 'bg-orange-100 group-hover:bg-orange-600', icon: 'text-orange-600 group-hover:text-white' },
} satisfies Record<string, { wrap: string; icon: string }>;

type StatIconColor = keyof typeof STAT_ICON_STYLES;

export function ClinicSettingsTab({ clinicId, onEdit }: ClinicSettingsTabProps) {
  const { clinicSettings, isLoading } = useClinicSettings(clinicId ?? '');

  if (isLoading) return <LoadingState message="Loading settings..." page />;
  if (!clinicSettings) return <div className="text-center py-10">No settings found</div>;

  const stats: Array<{ label: string; value: string; icon: typeof Clock; color: StatIconColor }> = [
    { label: 'Service Buffer', value: `${clinicSettings.serviceBufferTime} min`, icon: Clock, color: 'blue' },
    {
      label: 'Cancellation Window',
      value:
        clinicSettings.appointmentCancellationTimeHours != null
          ? `${clinicSettings.appointmentCancellationTimeHours} hours`
          : clinicSettings.appointmentCancellationTimeDays != null
            ? `${clinicSettings.appointmentCancellationTimeDays} days`
            : '—',
      icon: Calendar,
      color: 'purple',
    },
    { label: 'Availability Window', value: describeReleasePolicy(clinicSettings), icon: Calendar, color: 'green' },
    {
      label: 'Reschedule Limit',
      value: `${clinicSettings.rescheduleAppointmentLimit} time${clinicSettings.rescheduleAppointmentLimit !== 1 ? 's' : ''}`,
      icon: RefreshCw,
      color: 'orange',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${STAT_ICON_STYLES[stat.color].wrap}`}
            >
              <stat.icon className={`h-4.5 w-4.5 transition-colors ${STAT_ICON_STYLES[stat.color].icon}`} />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{stat.label}</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Appointment Settings</h2>
            <p className="mt-1 text-sm text-gray-500">Current configuration for appointment management</p>
          </div>
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
            >
              <Edit2 className="h-4 w-4" />
              Edit Settings
            </button>
          ) : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4 text-gray-500" />
              Service Buffer Time
            </label>
            <p className="text-lg font-medium text-gray-900">{clinicSettings.serviceBufferTime} minutes</p>
            <p className="mt-1 text-xs text-gray-500">
              Time needed between appointments for preparation and cleanup
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4 text-gray-500" />
              Cancellation Policy
            </label>
            <div className="space-y-1">
              <p className="text-sm text-gray-900">
                {clinicSettings.allowCancelAppointment ? (
                  <>✓ Customers can cancel appointments</>
                ) : (
                  <>✗ Customers cannot cancel appointments</>
                )}
              </p>
              {clinicSettings.allowCancelAppointment && (
                <p className="text-sm text-gray-600">
                  Notice required:{' '}
                  {clinicSettings.appointmentCancellationTimeHours != null
                    ? `${clinicSettings.appointmentCancellationTimeHours} hours`
                    : clinicSettings.appointmentCancellationTimeDays != null
                      ? `${clinicSettings.appointmentCancellationTimeDays} days`
                      : '—'}{' '}
                  before appointment
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <RefreshCw className="h-4 w-4 text-gray-500" />
              Reschedule Policy
            </label>
            <div className="space-y-1">
              <p className="text-sm text-gray-900">
                {clinicSettings.allowRescheduleAppointment ? (
                  <>✓ Customers can reschedule appointments</>
                ) : (
                  <>✗ Customers cannot reschedule appointments</>
                )}
              </p>
              {clinicSettings.allowRescheduleAppointment && (
                <p className="text-sm text-gray-600">
                  Maximum reschedule attempts: {clinicSettings.rescheduleAppointmentLimit}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4 text-gray-500" />
              Booking Rules
            </label>
            <div className="space-y-1">
              <p className="text-sm text-gray-900">
                {RELEASE_POLICY_LABELS[clinicSettings.availabilityReleasePolicy]}
                <span className="text-gray-500"> — {describeReleasePolicy(clinicSettings)}</span>
              </p>
              <p className="text-sm text-gray-600">
                {clinicSettings.autoConfirmAppointments ? (
                  <>✓ Appointments auto-confirmed</>
                ) : (
                  <>✗ Appointments require manual confirmation</>
                )}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4 text-gray-500" />
              Provider Selection Policy
            </label>
            <p className="text-sm text-gray-900">
              {PROVIDER_SELECTION_POLICY_LABELS[clinicSettings.doctorSelectionPolicy] ?? '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
