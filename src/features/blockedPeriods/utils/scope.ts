/**
 * A blocked period's scope is really one fact — "what does this block apply
 * to" — even though the wire shape represents it as two independent
 * nullable fields (`providerId`, `serviceId`). These helpers keep that
 * single-fact model in one place instead of re-deriving
 * `providerId ? ... : serviceId ? ... : ...` chains across the form, table,
 * and filters.
 *
 * Four scopes, matching exactly what the backend model already supports:
 *  - clinic: both null — applies clinic-wide.
 *  - provider: providerId set, serviceId null — this provider is
 *    unavailable for everything.
 *  - service: serviceId set, providerId null — this service is unavailable
 *    from any provider.
 *  - providerService: BOTH set — this one provider is unavailable for this
 *    one service specifically, but the service stays bookable with other
 *    providers, and the provider stays available for other services.
 */
export type BlockScope = 'clinic' | 'provider' | 'service' | 'providerService';

export function getBlockScope(target: { providerId: string | null; serviceId: string | null }): BlockScope {
  if (target.providerId && target.serviceId) return 'providerService';
  if (target.providerId) return 'provider';
  if (target.serviceId) return 'service';
  return 'clinic';
}

/** Builds the mutually-exclusive `providerId`/`serviceId` pair to send for a single-target scope (edit mode, always exactly one record). */
export function scopeToTargetIds(
  scope: BlockScope,
  providerId: string | null,
  serviceId: string | null
): { providerId: string | null; serviceId: string | null } {
  switch (scope) {
    case 'provider':
      return { providerId: providerId || null, serviceId: null };
    case 'service':
      return { providerId: null, serviceId: serviceId || null };
    case 'providerService':
      return { providerId: providerId || null, serviceId: serviceId || null };
    case 'clinic':
    default:
      return { providerId: null, serviceId: null };
  }
}

export interface TargetPair {
  providerId: string | null;
  serviceId: string | null;
}

/**
 * Expands a scope + selected id lists into the list of {providerId,
 * serviceId} pairs to create — one blocked-period record per pair. The
 * backend has no array/list field for this, so multi-select is a purely
 * client-side fan-out: N services selected → N records; providerService
 * scope with M providers × N services → the full M×N cartesian product
 * (each provider gets its own block against each service).
 */
export function scopeToTargetPairs(
  scope: BlockScope,
  providerIds: string[],
  serviceIds: string[]
): TargetPair[] {
  switch (scope) {
    case 'provider':
      return providerIds.map((providerId) => ({ providerId, serviceId: null }));
    case 'service':
      return serviceIds.map((serviceId) => ({ providerId: null, serviceId }));
    case 'providerService':
      return providerIds.flatMap((providerId) => serviceIds.map((serviceId) => ({ providerId, serviceId })));
    case 'clinic':
    default:
      return [{ providerId: null, serviceId: null }];
  }
}
