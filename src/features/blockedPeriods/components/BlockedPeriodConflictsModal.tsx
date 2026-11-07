'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';
import { Pagination } from '@/src/components/ui/Pagination';
import { useBlockedPeriodConflictsMutation } from '../hooks/useBlockedPeriods';
import { ConflictAppointmentsList } from './ConflictAppointmentsList';
import type { BlockedPeriodTimeInput } from '../types/types';

// Matches BlockedPeriodConflictsPayload's shape minus paging — arrays, and a
// key omitted entirely (not `[]`) when that dimension isn't in scope.
type ConflictScope = BlockedPeriodTimeInput & { providerIds?: string[]; serviceIds?: string[] };

interface BlockedPeriodConflictsModalProps {
  open: boolean;
  clinicId: string;
  conflictsCount: number;
  payload: ConflictScope;
  isSaving: boolean;
  onCancel: () => void;
  onForceSave: () => void;
  /** Shown as "Item X of Y" when this conflict paused a multi-target batch (e.g. several services selected at once). */
  progress?: { current: number; total: number };
  /** Extra one-line context for which specific target this conflict is for, e.g. "Sara Ahmed — Haircut". */
  targetLabel?: string;
}

const PAGE_SIZE = 10;

export function BlockedPeriodConflictsModal({
  open,
  clinicId,
  conflictsCount,
  payload,
  isSaving,
  onCancel,
  onForceSave,
  progress,
  targetLabel,
}: BlockedPeriodConflictsModalProps) {
  const [page, setPage] = useState(1);
  const { previewConflictsAsync, isPending, conflicts } = useBlockedPeriodConflictsMutation(clinicId);

  useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void previewConflictsAsync({ ...payload, page, limit: PAGE_SIZE });
  }, [open, page]);

  if (!open) return null;

  const appointments = conflicts?.appointments ?? [];
  const total = conflicts?.totalConflicts ?? conflictsCount;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={`${MODAL_OVERLAY_CLASS} z-[60]`}>
      <div className={MODAL_PANEL_CLASS}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-6 pb-3 pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  This overlaps {total} existing appointment{total === 1 ? '' : 's'}
                </h2>
                {progress && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                    Item {progress.current} of {progress.total}
                  </span>
                )}
              </div>
              {targetLabel && <p className="mt-0.5 text-xs font-medium text-gray-700">{targetLabel}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Review the appointments below, then save anyway if you still want to block this time —
                existing bookings are not cancelled automatically.
                {progress && progress.total > 1 && ' The rest of your selection is paused until you decide.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2.5 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isPending ? (
            <div className="py-10 text-center text-sm text-gray-400">Loading conflicting appointments…</div>
          ) : (
            <ConflictAppointmentsList appointments={appointments} />
          )}
        </div>

        {totalPages > 1 && (
          <div className="shrink-0 border-t border-gray-100 px-6 py-2">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              itemLabel="appointment"
              onPageChange={setPage}
              isFetching={isPending}
            />
          </div>
        )}

        <div className="flex flex-col-reverse shrink-0 justify-end gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {progress && progress.total > 1 ? 'Stop here' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onForceSave}
            className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : progress && progress.total > 1 ? 'Save anyway & continue' : 'Save anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
