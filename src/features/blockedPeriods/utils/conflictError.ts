export interface BlockedPeriodConflictInfo {
  conflictsCount: number;
}


export function getBlockedPeriodConflictInfo(err: unknown): BlockedPeriodConflictInfo | null {
  const data = (
    err as {
      response?: { data?: { code?: string; details?: { conflictsCount?: number } } };
    }
  )?.response?.data;

  if (data?.code !== 'BLOCKED_PERIOD_CONFLICT') return null;

  return { conflictsCount: data.details?.conflictsCount ?? 0 };
}
