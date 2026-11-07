import type { PaginationMeta, PaginationParams } from '@/src/types';

/** Wire shape from GET/POST/PATCH `/clinics/:id/blocked-periods*` — matches `SafeBlockedPeriod` on the backend. */
export interface RawBlockedPeriod {
  id: string;
  clinicId: string;
  providerId: string | null;
  serviceId: string | null;
  date: string;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  reason?: string;
  createdBy: string | null;
  createdAt: string;
}

/** Normalized blocked period — adds a client-derived `allDay` flag. */
export interface BlockedPeriod extends RawBlockedPeriod {
  allDay: boolean;
}

export interface BlockedPeriodListResponse {
  data: BlockedPeriod[];
  meta: PaginationMeta;
}

export interface GetBlockedPeriodsParams extends PaginationParams {
  date?: string;
  from?: string;
  to?: string;
  providerId?: string;
  serviceId?: string;
  scope?: 'provider' | 'service';
}


export interface BlockedPeriodTimeInput {
  date: string;
  allDay?: boolean;
  start?: string;
  end?: string;
}



export interface CreateBlockedPeriodPayload extends BlockedPeriodTimeInput {
  providerIds?: string[];
  serviceIds?: string[];
  reason?: string;
  /** Bypasses the 409 BLOCKED_PERIOD_CONFLICT guard. */
  force?: boolean;
}

/** PATCH /clinics/:id/blocked-periods/:blockedPeriodId */
export interface UpdateBlockedPeriodPayload extends Partial<BlockedPeriodTimeInput> {
  providerId?: string | null;
  serviceId?: string | null;
  /** null clears a previously-set reason. */
  reason?: string | null;
  force?: boolean;
}

/**
 * POST /clinics/:id/blocked-periods/conflicts
 * Arrays, not the singular `providerId`/`serviceId` create/update use — the
 * conflicts endpoint accepts a real backend contract distinct from create's:
 * `{ date, start, end, providerIds: [...] }`. Omit a key entirely when that
 * dimension isn't part of the scope being checked (don't send `[]`).
 */
export interface BlockedPeriodConflictsPayload extends BlockedPeriodTimeInput {
  providerIds?: string[];
  serviceIds?: string[];
  excludeBlockedPeriodId?: string;
  page?: number;
  limit?: number;
}

/** Minimal appointment shape returned by the conflict-preview endpoint. */
export interface ConflictAppointment {
  id: string;
  date: string;
  start: string;
  end: string;
  status: string;
  provider: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
  customer: { id: string; name: string; phoneNumber?: string } | null;
}

export interface BlockedPeriodConflictsResponse {
  totalConflicts: number;
  page: number;
  limit: number;
  hasMore: boolean;
  appointments: ConflictAppointment[];
}
