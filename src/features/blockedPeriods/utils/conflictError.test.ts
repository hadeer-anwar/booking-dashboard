import { describe, expect, it } from 'vitest';
import { getBlockedPeriodConflictInfo } from './conflictError';

/** Builds an axios-error-shaped object with the given response body. */
function axiosErrorWithBody(data: unknown) {
  return { response: { data } };
}

describe('getBlockedPeriodConflictInfo', () => {
  it('extracts conflictsCount from a well-formed 409 BLOCKED_PERIOD_CONFLICT error', () => {
    const err = axiosErrorWithBody({
      message: 'Overlaps existing appointments',
      code: 'BLOCKED_PERIOD_CONFLICT',
      details: { requiresForce: true, conflictsCount: 7 },
    });
    expect(getBlockedPeriodConflictInfo(err)).toEqual({ conflictsCount: 7 });
  });

  it('defaults conflictsCount to 0 when the backend omits it', () => {
    const err = axiosErrorWithBody({ code: 'BLOCKED_PERIOD_CONFLICT', details: {} });
    expect(getBlockedPeriodConflictInfo(err)).toEqual({ conflictsCount: 0 });
  });

  it('returns null for a different error code (e.g. validation failure) — must not be mistaken for a conflict', () => {
    const err = axiosErrorWithBody({ code: 'VALIDATION_ERROR', message: 'Invalid date' });
    expect(getBlockedPeriodConflictInfo(err)).toBeNull();
  });

  it('returns null when there is no response body at all (network error)', () => {
    expect(getBlockedPeriodConflictInfo(new Error('Network Error'))).toBeNull();
  });

  it('returns null for a plain string thrown as an error', () => {
    expect(getBlockedPeriodConflictInfo('boom')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(getBlockedPeriodConflictInfo(null)).toBeNull();
    expect(getBlockedPeriodConflictInfo(undefined)).toBeNull();
  });

  it('returns null when response.data exists but has no code field', () => {
    const err = axiosErrorWithBody({ message: 'Something else went wrong' });
    expect(getBlockedPeriodConflictInfo(err)).toBeNull();
  });
});
