import { describe, expect, it } from 'vitest';
import { describeReleasePolicy, RELEASE_POLICY_LABELS } from './releasePolicy';

describe('RELEASE_POLICY_LABELS', () => {
  it('has a label for every policy the backend can send', () => {
    expect(RELEASE_POLICY_LABELS.rolling_window).toBe('Rolling window');
    expect(RELEASE_POLICY_LABELS.monthly_release).toBe('Day of month');
    expect(RELEASE_POLICY_LABELS.fully_open).toBe('Fully open');
  });
});

describe('describeReleasePolicy', () => {
  it('describes rolling_window using maxAdvanceBookingDays, ignoring releaseDayOfMonth', () => {
    const result = describeReleasePolicy({
      availabilityReleasePolicy: 'rolling_window',
      maxAdvanceBookingDays: 45,
      releaseDayOfMonth: 25,
    });
    expect(result).toBe('45 days ahead');
  });

  it('describes monthly_release using releaseDayOfMonth, ignoring maxAdvanceBookingDays', () => {
    const result = describeReleasePolicy({
      availabilityReleasePolicy: 'monthly_release',
      maxAdvanceBookingDays: 45,
      releaseDayOfMonth: 25,
    });
    expect(result).toBe('Day 25 of month');
  });

  it('describes fully_open with a fixed message, ignoring both numeric fields', () => {
    const result = describeReleasePolicy({
      availabilityReleasePolicy: 'fully_open',
      maxAdvanceBookingDays: 45,
      releaseDayOfMonth: 25,
    });
    expect(result).toBe('No fixed horizon');
  });
});
