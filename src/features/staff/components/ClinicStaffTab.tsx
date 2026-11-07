'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, Shield, ShieldCheck, Search, ChevronRight, UserPlus, Mail, Phone } from 'lucide-react';
import type { ClinicSchedule, ClinicScheduleHour } from '@/src/features/schedule/types/types';
import { useClinicWorkspace } from '@/src/features/clinics/context/ClinicWorkspaceContext';
import { formatTime24To12 } from '@/src/utils/helpers';
import { AddClinicStaffModal } from '@/src/features/staff/components/AddClinicStaffModal';
import { useAuthStore } from '../../auth/store/auth.store';
import { Pagination } from '@/src/components/ui/Pagination';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

function hoursSignature(hours: ClinicScheduleHour[] | undefined): string {
  if (!hours?.length) return '';
  return hours.map((h) => `${h.start}-${h.end}`).join('|');
}

function compactGeneralHours(sched?: ClinicSchedule): string {
  if (!sched?.workingDays?.length) return 'No hours set';
  const open = sched.workingDays.filter((w) => w.isOpen && w.hours?.length);
  if (!open.length) return 'No working days';
  const days = open.map((w) => DAY_SHORT[w.day] ?? w.day.slice(0, 3)).join(', ');
  const sig0 = hoursSignature(open[0]!.hours);
  const uniform = open.every((w) => hoursSignature(w.hours) === sig0);
  const h0 = open[0]!.hours![0]!;
  const slot = uniform
    ? `${formatTime24To12(h0.start)}–${formatTime24To12(h0.end)}`
    : 'varied hours';
  return `${days} · ${slot}`;
}


function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase() || '?';
}

type RoleFilter = 'provider' | 'clinic_admin' | 'moderator';

const ROLE_PILL_STYLES: Record<RoleFilter, string> = {
  provider: 'bg-blue-50 text-blue-700',
  clinic_admin: 'bg-gray-100 text-gray-600',
  moderator: 'bg-violet-50 text-violet-700',
};

const ROLE_PILL_ICONS: Record<RoleFilter, typeof UserCircle> = {
  provider: UserCircle,
  clinic_admin: Shield,
  moderator: ShieldCheck,
};

const ROLE_PILL_LABELS: Record<RoleFilter, string> = {
  provider: 'Provider',
  clinic_admin: 'Admin',
  moderator: 'Moderator',
};

export function ClinicStaffTab() {
  const {
    clinicId,
    staffDetailBasePath,
    staffProviders,
    staffAdmins,
    staffModerators,
    staffSearch: search,
    setStaffSearch: onSearchChange,
    staffMeta: meta,
    setStaffPage: onPageChange,
    isStaffFetching: isFetching,
    refetchStaff,
  } = useClinicWorkspace();
  const user = useAuthStore((state) => state.user);
  // Only super_admin may submit role: "moderator" to POST /clinics/:id/staff
  // (backend's restrictModeratorAssignment) — clinic_admin/moderator viewers
  // of this same tab can still see the Moderators tab, just not add to it.
  const canAddModerator = user?.role === 'super_admin';
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [addRole, setAddRole] = useState<RoleFilter>('provider');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('provider');

  const filtered = useMemo(() => {
    if (roleFilter === 'provider') {
      return staffProviders.map((p) => ({ ...p, _role: 'provider' as const }));
    }
    if (roleFilter === 'moderator') {
      return staffModerators.map((m) => ({ ...m, _role: 'moderator' as const }));
    }
    return staffAdmins.map((a) => ({ ...a, _role: 'clinic_admin' as const }));
  }, [roleFilter, staffProviders, staffAdmins, staffModerators]);

  const stats = useMemo(
    () => ({
      providers: staffProviders.length,
      admins: staffAdmins.length,
      moderators: staffModerators.length,
    }),
    [staffProviders, staffAdmins, staffModerators],
  );

  const filterTabs: { key: RoleFilter; label: string; count: number }[] = [
    { key: 'provider', label: 'Providers', count: stats.providers },
    { key: 'clinic_admin', label: 'Admins', count: stats.admins },
    { key: 'moderator', label: 'Moderators', count: stats.moderators },
  ];

  const handleStaffMemberClick = (id: string): void => {
    if (user?.role === 'super_admin') return;
    router.push(`${staffDetailBasePath}/${id}`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by first or last name…"
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setAddRole('provider'); setAddOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            Add provider
          </button>
          <button
            type="button"
            onClick={() => { setAddRole('clinic_admin'); setAddOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
          >
            <Shield className="h-4 w-4 text-gray-500" />
            Add admin
          </button>
          {canAddModerator && (
            <button
              type="button"
              onClick={() => { setAddRole('moderator'); setAddOpen(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
            >
              <ShieldCheck className="h-4 w-4 text-gray-500" />
              Add moderator
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs + count */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setRoleFilter(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              roleFilter === tab.key
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              roleFilter === tab.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
            {roleFilter === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Data table */}
      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Name
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Contact
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Role
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Schedule
                  </th>
                 
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 w-24">
                    Status
                  </th>
                  <th className="px-5 py-3.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((member, idx) => {
                  const isProvider = member._role === 'provider';
                  const RolePillIcon = ROLE_PILL_ICONS[member._role];

                  return (
                    <tr
                      key={member.id}
                      onClick={() => void handleStaffMemberClick(member.id)}
                      className="group cursor-pointer border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-100/70 animate-fade-in-up"
                      style={{ '--stagger-index': idx } as React.CSSProperties}
                    >
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* One consistent brand-tinted circle for every
                              role — the separate role pill below already
                              carries the role-distinguishing color, so the
                              avatar itself just needs a single identity
                              treatment, matching the reference's patient
                              avatars. */}
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                            {initialsFromName(member.fullName)}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-medium text-gray-900 truncate max-w-[180px]">{member.fullName}</span>
                            {member.specialty && (
                              <span className="block text-xs text-gray-500 truncate max-w-[180px]">{member.specialty}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate max-w-[180px]">{member.email}</span>
                          </div>
                          {member.phoneNumber && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              <span>{member.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_PILL_STYLES[member._role]}`}>
                          <RolePillIcon className="h-3 w-3" />
                          {ROLE_PILL_LABELS[member._role]}
                        </span>
                      </td>

                      {/* Schedule */}
                      <td className="px-5 py-4">
                        {isProvider ? (
                          <span className="text-xs text-gray-600">
                            {compactGeneralHours(member?.schedule as ClinicSchedule)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>


                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge active={Boolean(member?.isActive)} />
                      </td>

                      {/* Arrow */}
                      <td className="px-3 py-4">
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta && onPageChange ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.limit}
              itemLabel="staff member"
              onPageChange={onPageChange}
              isFetching={isFetching}
            />
          ) : (
            <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-3 text-xs text-gray-500">
              {roleFilter === 'provider'
                ? `Showing ${filtered.length} of ${stats.providers} providers on this page`
                : roleFilter === 'moderator'
                ? `Showing ${filtered.length} of ${stats.moderators} moderators on this page`
                : `Showing ${filtered.length} of ${stats.admins} admins on this page`}
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <EmptyState
          icon={UserCircle}
          title="No staff members"
          description={
            roleFilter === 'provider'
              ? 'Add a provider to start accepting bookings.'
              : roleFilter === 'moderator'
              ? 'No moderators have been added yet.'
              : 'No administrators have been added yet.'
          }
          variant="subtle"
          compact
          action={
            roleFilter === 'moderator' && !canAddModerator
              ? undefined
              : {
                  label: roleFilter === 'clinic_admin' ? 'Add admin' : roleFilter === 'moderator' ? 'Add moderator' : 'Add provider',
                  icon: UserPlus,
                  onClick: () => {
                    setAddRole(roleFilter);
                    setAddOpen(true);
                  },
                }
          }
        />
      )}

      <AddClinicStaffModal
        open={addOpen}
        clinicId={clinicId}
        defaultRole={addRole}
        onClose={() => setAddOpen(false)}
        onSaved={() => void refetchStaff()}
      />
    </div>
  );
}
