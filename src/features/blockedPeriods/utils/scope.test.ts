import { describe, expect, it } from 'vitest';
import { getBlockScope, scopeToTargetIds, scopeToTargetPairs } from './scope';

describe('getBlockScope', () => {
  it('returns "clinic" when both providerId and serviceId are null', () => {
    expect(getBlockScope({ providerId: null, serviceId: null })).toBe('clinic');
  });

  it('returns "provider" when only providerId is set', () => {
    expect(getBlockScope({ providerId: 'p1', serviceId: null })).toBe('provider');
  });

  it('returns "service" when only serviceId is set', () => {
    expect(getBlockScope({ providerId: null, serviceId: 's1' })).toBe('service');
  });

  it('returns "providerService" when both are set (legacy combo records)', () => {
    expect(getBlockScope({ providerId: 'p1', serviceId: 's1' })).toBe('providerService');
  });
});

describe('scopeToTargetIds (edit mode — always a single target)', () => {
  it('clinic scope always nulls out both ids, even if some were passed in', () => {
    expect(scopeToTargetIds('clinic', 'p1', 's1')).toEqual({ providerId: null, serviceId: null });
  });

  it('provider scope keeps providerId and forces serviceId to null', () => {
    expect(scopeToTargetIds('provider', 'p1', 's1')).toEqual({ providerId: 'p1', serviceId: null });
  });

  it('service scope keeps serviceId and forces providerId to null', () => {
    expect(scopeToTargetIds('service', 'p1', 's1')).toEqual({ providerId: null, serviceId: 's1' });
  });

  it('providerService scope keeps both', () => {
    expect(scopeToTargetIds('providerService', 'p1', 's1')).toEqual({ providerId: 'p1', serviceId: 's1' });
  });

  it('treats an empty string id as absent (null), not as a literal empty-string id', () => {
    // The picker's "nothing selected" state is '', and this must never be
    // sent to the API as a literal empty-string providerId/serviceId.
    expect(scopeToTargetIds('provider', '', null)).toEqual({ providerId: null, serviceId: null });
    expect(scopeToTargetIds('service', null, '')).toEqual({ providerId: null, serviceId: null });
  });
});

describe('scopeToTargetPairs (create mode — the multi-select fan-out)', () => {
  it('clinic scope always produces exactly one clinic-wide pair, regardless of what ids are passed', () => {
    expect(scopeToTargetPairs('clinic', ['p1', 'p2'], ['s1'])).toEqual([{ providerId: null, serviceId: null }]);
    expect(scopeToTargetPairs('clinic', [], [])).toEqual([{ providerId: null, serviceId: null }]);
  });

  it('provider scope produces exactly one pair per selected provider, each with serviceId null', () => {
    expect(scopeToTargetPairs('provider', ['p1', 'p2', 'p3'], [])).toEqual([
      { providerId: 'p1', serviceId: null },
      { providerId: 'p2', serviceId: null },
      { providerId: 'p3', serviceId: null },
    ]);
  });

  it('provider scope with no providers selected produces zero pairs (not one null-target pair)', () => {
    expect(scopeToTargetPairs('provider', [], [])).toEqual([]);
  });

  it('service scope produces exactly one pair per selected service, each with providerId null', () => {
    expect(scopeToTargetPairs('service', [], ['s1', 's2'])).toEqual([
      { providerId: null, serviceId: 's1' },
      { providerId: null, serviceId: 's2' },
    ]);
  });

  it('service scope with no services selected produces zero pairs', () => {
    expect(scopeToTargetPairs('service', [], [])).toEqual([]);
  });

  it('providerService scope produces the full M×N cartesian product, not just M+N', () => {
    const pairs = scopeToTargetPairs('providerService', ['p1', 'p2'], ['s1', 's2', 's3']);
    expect(pairs).toHaveLength(6);
    expect(pairs).toEqual([
      { providerId: 'p1', serviceId: 's1' },
      { providerId: 'p1', serviceId: 's2' },
      { providerId: 'p1', serviceId: 's3' },
      { providerId: 'p2', serviceId: 's1' },
      { providerId: 'p2', serviceId: 's2' },
      { providerId: 'p2', serviceId: 's3' },
    ]);
  });

  it('providerService scope with only providers (no services) selected yet produces zero pairs, not a partial/malformed pair', () => {
    expect(scopeToTargetPairs('providerService', ['p1'], [])).toEqual([]);
  });

  it('providerService scope with only services (no providers) selected yet produces zero pairs', () => {
    expect(scopeToTargetPairs('providerService', [], ['s1'])).toEqual([]);
  });

  it('providerService with exactly one provider and one service produces exactly one pair (the simple combo case)', () => {
    expect(scopeToTargetPairs('providerService', ['p1'], ['s1'])).toEqual([{ providerId: 'p1', serviceId: 's1' }]);
  });
});
