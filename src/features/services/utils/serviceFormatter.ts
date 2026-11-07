import type { ServiceAssignment } from '@/src/features/staff/types/types';

/**
 * Returns the display name for a service assignment provider.
 * Falls back to email when first/last name are absent.
 */
export function assignmentProviderName(a: ServiceAssignment): string {
  const name = [a.provider.firstName, a.provider.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return name || a.provider.email;
}

/**
 * Returns a compact schedule summary string such as:
 *   "Mon 09:00–17:00 · Tue 09:00–17:00"
 * Returns null when no open working days exist.
 */
export function scheduleDaysSummary(a: ServiceAssignment): string | null {
  const sched =
    a.schedule?.workingDays?.some((d) => d.isOpen) ? a.schedule : a.provider.schedule;

  if (!sched?.workingDays?.length) return null;

  const openDays = sched.workingDays.filter((d) => d.isOpen);
  if (openDays.length === 0) return null;

  return openDays
    .map((d) => {
      const dayShort = d.day.slice(0, 3);
      if (!d.hours?.length) return dayShort;
      const hours = d.hours.map((h) => `${h.start}–${h.end}`).join(', ');
      return `${dayShort} ${hours}`;
    })
    .join(' · ');
}