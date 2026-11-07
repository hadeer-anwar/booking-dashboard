'use client';

import { useState } from 'react';
import { Loader2, UserCircle, X, Trash2, AlertTriangle } from 'lucide-react';
import type { ServiceAssignment } from '@/src/features/staff/types/types';
import type { Service } from '../types/types';
import { useDeactivateAssignmentMutation } from '@/src/features/staff/hooks/useServiceAssignments';
import { assignmentProviderName, scheduleDaysSummary } from '../utils/serviceFormatter';
import { AssignProviderButton } from './AssignProviderButton';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';
import { StatusBadge } from '@/src/components/ui/StatusBadge';

interface ServiceProvidersModalProps {
  open: boolean;
  service: Service | null;
  clinicId: string;
  assignments: ServiceAssignment[] | null;
  loading: boolean;
  onClose: () => void;
  onAssignProvider: () => void;
  onChanged?: () => void | Promise<void>;
}


export function ServiceProvidersModal({
  open,
  service,
  clinicId,
  assignments,
  loading,
  onClose,
  onAssignProvider,
  onChanged,
}: ServiceProvidersModalProps) {
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { deactivateAssignmentAsync } = useDeactivateAssignmentMutation();

  if (!open || !service) return null;

  const list = assignments ?? [];

  const handleConfirmRemove = async (assignment: ServiceAssignment) => {
    setRemovingId(assignment.id);
    try {
      await deactivateAssignmentAsync({
        assignmentId: assignment.id,
        clinicId,
        serviceId: service.id,
      });
      setPendingRemoveId(null);
      await onChanged?.();
    } catch {
      // Toast surfaced by the mutation's onError handler.
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_CLASS}>
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 pb-4 pt-6">
          <div className="min-w-0 pr-2">
            <h2 className="text-lg font-semibold text-gray-900">Assigned providers</h2>
            <p className="mt-1 text-sm text-gray-500 truncate">
              Providers offering{' '}
              <span className="font-medium text-gray-800">{service.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {list.length} provider{list.length !== 1 ? 's' : ''}
            </span>
            <AssignProviderButton
              onClick={(e) => {
                e.stopPropagation();
                onAssignProvider();
              }}
              variant="inline"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-400">Loading providers…</span>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-10 text-center">
              <p className="mb-3 text-sm text-gray-500">No providers assigned yet</p>
              <AssignProviderButton
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignProvider();
                }}
                variant="empty-state"
              />
            </div>
          ) : (
            <ul className="space-y-2 pr-1">
              {list.map((a) => {
                const name = assignmentProviderName(a);
                const scheduleInfo = scheduleDaysSummary(a);
                const isConfirming = pendingRemoveId === a.id;
                const isRemoving = removingId === a.id;

                return (
                  <li key={a.id}>
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0 rounded-full bg-gray-100 p-1.5">
                            <UserCircle className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-900">
                              {name}
                            </span>
                            <span className="block truncate text-xs text-gray-500">
                              {a.provider.email}
                            </span>
                            {scheduleInfo && (
                              <span className="block truncate text-xs text-gray-400 mt-0.5">
                                {scheduleInfo}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge active={a.isActive} />

                          {!isConfirming && a.isActive && (
                            <button
                              type="button"
                              onClick={() => setPendingRemoveId(a.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remove ${name} from this service`}
                              title="Remove from service"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline confirmation */}
                      {isConfirming && (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50/70 px-3 py-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                            <p className="text-xs text-red-700">
                              Remove <span className="font-medium">{name}</span> from this service?
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => setPendingRemoveId(null)}
                              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => void handleConfirmRemove(a)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {isRemoving ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Removing…
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-3 w-3" />
                                  Remove
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
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
