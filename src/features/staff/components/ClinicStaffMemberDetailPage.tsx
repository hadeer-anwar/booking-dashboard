'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  UserCircle,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  Edit2,
  Activity,
  Clock,
} from 'lucide-react';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { formatTime24To12, to24hString } from '@/src/utils/helpers';
import { ALL_DAYS, UpdateClinicStaffPayload } from '@/src/features/staff/types/types';
import {
 
  scheduleToDayEditors,
  type DayEditor,
} from '../utils/schedule.utils';
import {
  useMember,
  useMemberSchedule,
  useMemberStatusMutation,
  useMemberProfileMutation,
} from '../hooks/useStaff';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { StaffProfileForm, StaffProfileFormValues } from './StaffProfileForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import type { SlotDraft } from '@/src/features/staff/types/types';

/* ─── Props ──────────────────────────────────────────────────────────────── */

export interface ClinicStaffMemberDetailPageProps {
  clinicId: string;
  providerId: string;
  backHref: string;
  backLabel: string;
  clinicName?: string;
  onOpenFullSchedule?: () => void;
  onOpenDaySchedule?: (day: string | null) => void;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export function ClinicStaffMemberDetailPage({
  clinicId,
  providerId,
  backHref,
  backLabel,
  clinicName,
  onOpenFullSchedule,
  onOpenDaySchedule,
}: ClinicStaffMemberDetailPageProps) {

  /* ── Data fetching ───────────────────────────────────────────────────── */
  const { member, isLoading, error } = useMember(clinicId, providerId);
  // The change-password endpoint always acts on whoever's access token
  // sent the request, never on the `providerId` in this page's URL — so
  // the form must only ever appear when you're looking at your own
  // profile, not when an admin is viewing/editing a different staff
  // member's page (which reuses this exact same component).
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isOwnProfile = Boolean(currentUserId) && currentUserId === providerId;

  const { schedule, isLoading: scheduleLoading } = useMemberSchedule(clinicId, providerId);

    const { updateStatus, isPending: statusSubmitting } = useMemberStatusMutation();
  const { updateProfile, isPending: profileSubmitting } = useMemberProfileMutation();

  /* ── Local UI state ──────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<'profile' | 'schedule'>('profile');

  /* ── Derived data ────────────────────────────────────────────────────── */
  const isProvider = member?.role === 'provider';
  const isModerator = member?.role === 'moderator';
  // Moderator behaves exactly like clinic_admin here (profile-only, no
  // schedule tab) — this only picks the label shown for it, not any of the
  // isProvider-driven behavior below.
  const roleLabel = isProvider ? 'Service provider' : isModerator ? 'Moderator' : 'Clinic administrator';
  const roleBadgeLabel = isProvider ? 'Provider' : isModerator ? 'Moderator' : 'Admin';

 
  const dayEditors = useMemo<DayEditor[]>(() => {
    return scheduleToDayEditors(schedule ?? null);
  }, [schedule]);

  const openDaysSorted = useMemo(
    () =>
      [...dayEditors]
        .filter((d) => d.isOpen)
        .sort(
          (a, b) =>
            ALL_DAYS.indexOf(a.day as (typeof ALL_DAYS)[number]) -
            ALL_DAYS.indexOf(b.day as (typeof ALL_DAYS)[number])
        ),
    [dayEditors]
  );

  const openDayCount = dayEditors.filter((d) => d.isOpen).length;

  const profileDefaultValues = useMemo<StaffProfileFormValues>(
    () => ({
      firstName: member?.firstName ?? '',
      lastName: member?.lastName ?? '',
      email: member?.email ?? '',
      phoneNumber: member?.phoneNumber ?? '',
      country: member?.country ?? '',
      specialty: member?.specialty ?? '',
    }),
    [member]
  );

  /* ── Handlers ────────────────────────────────────────────────────────── */

  const handleSaveProfile = (payload: UpdateClinicStaffPayload) => {
    if (!member) return;
    updateProfile({ clinicId, userId: member.id, payload });
  };

  const handleToggleStatus = () => {
    if (!member) return;
    updateStatus({ clinicId, userId: member.id, isActive: !member.isActive });
  };

  /* ── Loading / error gates ───────────────────────────────────────────── */

  if (isLoading || scheduleLoading) {
    return <LoadingState message="Loading team member..." page />;
  }

  if (error || !member) {
    return <ErrorState message="Could not load team member." page />;
  }

  /* ── Tab config ──────────────────────────────────────────────────────── */

  const tabs = isProvider
    ? [
        { id: 'profile' as const, label: 'Profile', icon: UserCircle },
        { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
      ]
    : [{ id: 'profile' as const, label: 'Profile', icon: UserCircle }];

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-7xl animate-fade-in-up">

      {/* ── Dark header ────────────────────────────────────────────────── */}
      <DashboardPageHeader className="mb-6">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{backLabel}</span>
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {clinicName && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                {clinicName}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl text-gray-900 sm:text-3xl">
                {member.firstName} {member.lastName}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                  member.isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-100 text-gray-600'
                }`}
              >
                {member.isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-gray-400" />
                )}
                {member.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              {roleLabel} — manage profile
              {isProvider ? ' and weekly schedule' : ''}
            </p>
          </div>

          <button
            type="button"
            disabled={statusSubmitting}
            onClick={handleToggleStatus}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {statusSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Updating…
              </>
            ) : member.isActive ? (
              'Deactivate'
            ) : (
              'Activate'
            )}
          </button>
        </div>
      </DashboardPageHeader>

      {/* ── Tabbed card ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* Tab bar */}
        <div className="border-b border-gray-200">
          <div className="flex gap-6 overflow-x-auto px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative shrink-0 whitespace-nowrap py-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gray-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">

          {/* ── Profile tab ──────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                <span>
                  <span className="font-semibold text-gray-900">
                    {roleBadgeLabel}
                  </span>{' '}
                  role
                </span>
                {member.createdAt && (
                  <span>
                    Member since{' '}
                    <span className="font-semibold text-gray-900">
                      {new Date(member.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </span>
                )}
                {isProvider && (
                  <span>
                    <span className="font-semibold text-gray-900">{openDayCount}</span> / 7 working
                    days
                  </span>
                )}
                {member.specialty && (
                  <span>
                    Specialty:{' '}
                    <span className="font-semibold text-gray-900">{member.specialty}</span>
                  </span>
                )}
              </div>

              <StaffProfileForm
                defaultValues={profileDefaultValues}
                isProvider={isProvider}
                isSubmitting={profileSubmitting}
                onSubmit={handleSaveProfile}
              />

              {isOwnProfile && <ChangePasswordForm />}

              {!isProvider && (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-5 text-sm text-gray-500">
                  This is a {isModerator ? 'moderator' : 'clinic administrator'} account. Schedules and
                  service assignments apply only to service providers.
                </div>
              )}
            </div>
          )}

          {/* ── Schedule tab (provider only) ──────────────────────────── */}
          {activeTab === 'schedule' && isProvider && (
            <div className="space-y-6">

              {/* Section heading + action buttons */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Weekly Schedule</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Provider operating hours and availability
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {onOpenDaySchedule && (
                    <button
                      type="button"
                      onClick={() => onOpenDaySchedule(null)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit day
                    </button>
                  )}
                  {onOpenFullSchedule && (
                    <button
                      type="button"
                      onClick={onOpenFullSchedule}
                      className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300"
                    >
                      Edit full schedule
                    </button>
                  )}
                </div>
              </div>

              {/* Schedule table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {openDaysSorted.length ? (
                  <>
                    {/* Column headers only make sense once the row itself is a
                        real 12-col grid — hidden below sm: where rows switch
                        to a stacked mobile layout instead. */}
                    <div className="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-gray-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 sm:grid">
                      <div className="col-span-3">Day</div>
                      <div className="col-span-8">Operating Hours</div>
                      <div className="col-span-1 text-right">Edit</div>
                    </div>

                    {openDaysSorted.map((d) => (
                      <div
                        key={d.day}
                        className="grid grid-cols-1 gap-2 border-b border-gray-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50 sm:grid-cols-12 sm:items-center sm:gap-4"
                      >
                        {/* Day name */}
                        <div className="col-span-3 flex items-center justify-between gap-2 sm:justify-start">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            <span className="text-sm font-medium text-gray-900">{d.day}</span>
                          </div>
                          {/* Same edit action, shown here on mobile (paired
                              with the day name) and hidden once its own
                              column reappears at sm:. */}
                          {onOpenDaySchedule && (
                            <button
                              type="button"
                              onClick={() => onOpenDaySchedule(d.day)}
                              className="rounded-lg p-2.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 sm:hidden"
                              aria-label={`Edit ${d.day}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Slot pills */}
                        {/* FIX: was accessing d.slots which was undefined because the old
                            scheduleToDayEditors returned `.hours` not `.slots`. Now that
                            scheduleToDayEditors returns DayEditor[], `.slots` is correct. */}
                        <div className="col-span-8">
                          {d.slots.length ? (
                            <div className="flex flex-wrap gap-2">
                              {d.slots.map((slot: SlotDraft) => (
                                <div
                                  key={slot.clientId}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm"
                                >
                                  <span className="font-medium text-gray-900">
                                    {formatTime24To12(to24hString(slot.start))}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-medium text-gray-900">
                                    {formatTime24To12(to24hString(slot.end))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm italic text-gray-400">No hours set</span>
                          )}
                        </div>

                        {/* Per-day edit button */}
                        <div className="col-span-1 hidden justify-end sm:flex">
                          {onOpenDaySchedule && (
                            <button
                              type="button"
                              onClick={() => onOpenDaySchedule(d.day)}
                              className="rounded-lg p-2.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
                              aria-label={`Edit ${d.day}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Footer summary */}
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          <span className="font-medium text-gray-900">{openDayCount}</span>{' '}
                          operating days
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Empty state */
                  <div className="px-4 py-12 text-center">
                    <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gray-100 p-3">
                      <Clock className="h-6 w-6 text-gray-500" />
                    </div>
                    <h3 className="mb-1 text-sm font-medium text-gray-900">
                      No schedule configured
                    </h3>
                    <p className="mx-auto mb-4 max-w-sm text-xs text-gray-500">
                      Set up working hours so patients know when this provider is available.
                    </p>
                    {(onOpenDaySchedule || onOpenFullSchedule) && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {onOpenDaySchedule && (
                          <button
                            type="button"
                            onClick={() => onOpenDaySchedule(null)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
                          >
                            <Edit2 className="h-4 w-4" /> Edit day
                          </button>
                        )}
                        {onOpenFullSchedule && (
                          <button
                            type="button"
                            onClick={onOpenFullSchedule}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
                          >
                            Edit full schedule
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Today's hours banner */}
              {(() => {
                const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                // FIX: was using `dayEditors.find(...)` and then accessing
                // `todayEditor.slots` — now correctly typed as DayEditor with `.slots`.
                const todayEditor = dayEditors.find((x) => x.day === todayName);
                if (!todayEditor?.isOpen || !todayEditor.slots.length) return null;

                return (
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2 text-gray-600">
                      <Activity className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="font-medium">Today&apos;s hours:</span>
                      <span className="text-gray-900">
                        {todayEditor.slots
                          .map(
                            (h: SlotDraft) =>
                              `${formatTime24To12(to24hString(h.start))} – ${formatTime24To12(to24hString(h.end))}`
                          )
                          .join(', ')}
                      </span>
                    </div>
                    <span className="shrink-0 font-medium text-emerald-600">Open now</span>
                  </div>
                );
              })()}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}