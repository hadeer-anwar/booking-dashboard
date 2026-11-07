import { api } from '@/src/lib/api/axios';
import { buildListQuery, extractPaginationMeta } from '@/src/lib/api/pagination';
import type {
  BlockedPeriod,
  BlockedPeriodConflictsPayload,
  BlockedPeriodConflictsResponse,
  BlockedPeriodListResponse,
  CreateBlockedPeriodPayload,
  GetBlockedPeriodsParams,
  RawBlockedPeriod,
  UpdateBlockedPeriodPayload,
} from '../types/types';

const FULL_DAY_START = 0;
const FULL_DAY_END = 1440;

function normalizeBlockedPeriod(raw: RawBlockedPeriod): BlockedPeriod {
  return {
    ...raw,
    allDay: raw.startMinutes === FULL_DAY_START && raw.endMinutes === FULL_DAY_END,
  };
}

export const blockedPeriodsApi = {
  /** GET /clinics/:id/blocked-periods */
  list: async (
    clinicId: string,
    params?: GetBlockedPeriodsParams
  ): Promise<BlockedPeriodListResponse> => {
    const response = await api.get<{ data: RawBlockedPeriod[]; meta?: unknown }>(
      `/clinics/${clinicId}/blocked-periods`,
      {
        params: buildListQuery(params, {
          date: params?.date,
          from: params?.from,
          to: params?.to,
          providerId: params?.providerId,
          serviceId: params?.serviceId,
        }),
      }
    );
    const data = (response.data?.data ?? []).map(normalizeBlockedPeriod);
    const meta = extractPaginationMeta(response.data, {
      page: params?.page,
      limit: params?.limit,
      resultCount: data.length,
    });
    return { data, meta };
  },

  /** GET /clinics/:id/blocked-periods/:blockedPeriodId */
  getById: async (clinicId: string, blockedPeriodId: string): Promise<BlockedPeriod> => {
    const response = await api.get<{ blockedPeriod: RawBlockedPeriod }>(
      `/clinics/${clinicId}/blocked-periods/${blockedPeriodId}`
    );
    return normalizeBlockedPeriod(response.data.blockedPeriod);
  },

  /**
   * POST /clinics/:id/blocked-periods
   * Response wraps an ARRAY (`blockedPeriods`), not a singular `blockedPeriod`
   * — the backend fans a multi-id `providerIds`/`serviceIds` payload out into
   * one record per id server-side and returns all of them. Every call site
   * in this app currently sends at most one id per array (the client does
   * its own one-target-at-a-time sequencing — see BlockedPeriodFormModal's
   * runCreateBatch), so taking the first record is always the whole result
   * for now; this return type stays a single `BlockedPeriod` to match that.
   */
  create: async (
    clinicId: string,
    payload: CreateBlockedPeriodPayload
  ): Promise<BlockedPeriod> => {
    const response = await api.post<{ message: string; blockedPeriods: RawBlockedPeriod[] }>(
      `/clinics/${clinicId}/blocked-periods`,
      payload
    );
    const [created] = response.data.blockedPeriods ?? [];
    if (!created) {
      throw new Error('Blocked period creation succeeded but the server returned no record.');
    }
    return normalizeBlockedPeriod(created);
  },

  /** PATCH /clinics/:id/blocked-periods/:blockedPeriodId */
  update: async (
    clinicId: string,
    blockedPeriodId: string,
    payload: UpdateBlockedPeriodPayload
  ): Promise<BlockedPeriod> => {
    const response = await api.patch<{ blockedPeriod: RawBlockedPeriod }>(
      `/clinics/${clinicId}/blocked-periods/${blockedPeriodId}`,
      payload
    );
    return normalizeBlockedPeriod(response.data.blockedPeriod);
  },

  /** DELETE /clinics/:id/blocked-periods/:blockedPeriodId */
  delete: async (clinicId: string, blockedPeriodId: string): Promise<void> => {
    await api.delete(`/clinics/${clinicId}/blocked-periods/${blockedPeriodId}`);
  },

  /**
   * POST /clinics/:id/blocked-periods/conflicts — previews the appointments a
   * prospective block would overlap, so the UI can show them before the admin
   * resubmits create/update with `force: true`.
   */
  previewConflicts: async (
    clinicId: string,
    payload: BlockedPeriodConflictsPayload
  ): Promise<BlockedPeriodConflictsResponse> => {
    const response = await api.post<BlockedPeriodConflictsResponse>(
      `/clinics/${clinicId}/blocked-periods/conflicts`,
      payload
    );
    return response.data;
  },
};
