'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, SearchCheck, X } from 'lucide-react';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';
import { Pagination } from '@/src/components/ui/Pagination';
import { useBlockedPeriodConflictsMutation } from '../hooks/useBlockedPeriods';
import { ConflictAppointmentsList } from './ConflictAppointmentsList';
import type { BlockedPeriodConflictsPayload } from '../types/types';

interface CheckConflictsModalProps {
  open: boolean;
  clinicId: string;
  /** Everything except paging — this modal owns its own page state. */
  payload: Omit<BlockedPeriodConflictsPayload, 'page' | 'limit'>;
  onClose: () => void;
}

const PAGE_SIZE = 10;

/**
 * A purely informational "does this time period overlap any bookings?"
 * check the admin can run on demand before ever submitting — distinct from
 * BlockedPeriodConflictsModal, which only appears reactively after a
 * create/update call itself 409s and needs force-save/resume-batch actions.
 * This one never drives or blocks the actual submit; it just answers the
 * question (including the "no conflicts" case, which the reactive modal has
 * no reason to ever show) and gets out of the way.
 */
export function CheckConflictsModal({ open, clinicId, payload, onClose }: CheckConflictsModalProps) {
  const [page, setPage] = useState(1);
  const { previewConflictsAsync, isPending, conflicts } = useBlockedPeriodConflictsMutation(clinicId);

  useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void previewConflictsAsync({ ...payload, page, limit: PAGE_SIZE });
    // Re-checking on every keystroke of `payload` would fire a request per
    // character typed in the reason field etc. — only page and the open
    // transition itself should re-trigger a fetch; the button that opens
    // this modal already captures the form's current values at click time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page]);

  if (!open) return null;

  const appointments = conflicts?.appointments ?? [];
  const total = conflicts?.totalConflicts ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasConflicts = !isPending && total > 0;
  const noConflicts = !isPending && total === 0;

  return (
    <div className={`${MODAL_OVERLAY_CLASS} z-[60]`}>
      <div className={MODAL_PANEL_CLASS}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-6 pb-3 pt-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                noConflicts ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {noConflicts ? <CheckCircle2 className="h-4 w-4" /> : <SearchCheck className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isPending
                  ? 'Checking for conflicts…'
                  : noConflicts
                    ? 'No conflicts found'
                    : `Overlaps ${total} existing appointment${total === 1 ? '' : 's'}`}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isPending
                  ? 'Looking for appointments already booked in this window.'
                  : noConflicts
                    ? "No appointments are booked during this date/time range for what you've selected — it looks clear to create."
                    : "These appointments are already booked during this window. Creating the blocked period won't cancel them automatically."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2.5 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isPending ? (
            <div className="py-10 text-center text-sm text-gray-400">Checking…</div>
          ) : hasConflicts ? (
            <ConflictAppointmentsList appointments={appointments} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm text-gray-500">This time period is free of existing bookings.</p>
            </div>
          )}
        </div>

        {hasConflicts && totalPages > 1 && (
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

        <div className="flex shrink-0 justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
