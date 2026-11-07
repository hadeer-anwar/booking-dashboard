import type { AvailabilityReleasePolicy, ClinicSettings } from '../types/types';

export const RELEASE_POLICY_LABELS: Record<AvailabilityReleasePolicy, string> = {
  rolling_window: 'Rolling window',
  monthly_release: 'Day of month',
  fully_open: 'Fully open',
};

/** Short human-readable value for stat tiles / read-only summaries. */
export function describeReleasePolicy(
  settings: Pick<ClinicSettings, 'availabilityReleasePolicy' | 'maxAdvanceBookingDays' | 'releaseDayOfMonth'>
): string {
  switch (settings.availabilityReleasePolicy) {
    case 'monthly_release':
      return `Day ${settings.releaseDayOfMonth} of month`;
    case 'fully_open':
      return 'No fixed horizon';
    case 'rolling_window':
    default:
      return `${settings.maxAdvanceBookingDays} days ahead`;
  }
}
