'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, UserCircle, Search } from 'lucide-react';
import type { Service } from '@/src/features/services/types/types';
import { useAssignProviderToServiceMutation, useServiceAssignments } from '../hooks/useServiceAssignments';
import { ClinicStaffMember } from '../types/types';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';

/** Scroll viewport ≈ five provider rows (card + gap) so the dialog stays compact. */
const PROVIDER_LIST_MAX_HEIGHT =
  'max-h-[min(27.5rem,calc(90dvh-14rem))]';

interface AssignServiceProviderModalProps {
  open: boolean;
  clinicId: string;
  service: Service;
  staffProviders: ClinicStaffMember[];
  onClose: () => void;
  onAssigned?: () => void | Promise<void>;
}

export function AssignServiceProviderModal({
  open,
  clinicId,
  service,
  staffProviders,
  onClose,
  onAssigned,
}: AssignServiceProviderModalProps) {
  const [query, setQuery] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const { assignProviderAsync, isPending } = useAssignProviderToServiceMutation();

  // Fetch current assignments to deduplicate the candidate list.
  // No pagination — the backend returns all assignments for this service.
  const { assignments } = useServiceAssignments({
    clinicId,
    serviceId: service?.id ?? '',
    enabled: open && Boolean(service?.id),
  });

  useEffect(() => {
    if (open) setQuery('');
  }, [open, service?.id]);

  /** Provider IDs that are already actively assigned to this service */
  const assignedProviderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of assignments ?? []) {
      if (a.isActive) {
        ids.add(a.provider.id);
      }
    }
    return ids;
  }, [assignments]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staffProviders.filter((p) => {
      if (assignedProviderIds.has(p.id)) return false;
      if (!q) return true;
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.specialty?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [staffProviders, assignedProviderIds, query]);

  const handleAssign = async (providerId: string) => {
    if (!service) return;
    setSubmittingId(providerId);
    try {
      await assignProviderAsync({ clinicId, serviceId: service.id, providerId });
      await onAssigned?.();
      onClose();
    } catch {
      // Toast surfaced by the mutation's onError handler.
    } finally {
      setSubmittingId(null);
    }
  };

  if (!open || !service) return null;

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={`${MODAL_PANEL_CLASS} min-h-0`}>
        <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 pb-3 pt-6">
          <div className="min-w-0 pr-2">
            <h2 className="text-lg font-semibold text-gray-900">Assign provider</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a service provider for{' '}
              <span className="font-medium text-gray-800">{service.name}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2.5 hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-col px-6 pb-6 pt-4">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or specialty…"
              className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <div
            className={`mt-4 min-h-0 overflow-y-auto overscroll-contain ${PROVIDER_LIST_MAX_HEIGHT}`}
          >
            {candidates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center px-4">
                <p className="text-sm text-gray-600">
                  {staffProviders.length === 0
                    ? 'No service providers on this clinic yet. Add staff first.'
                    : assignedProviderIds.size >= staffProviders.length
                      ? 'Every clinic provider is already assigned to this service.'
                      : 'No providers match your search.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-2 pb-1">
                {candidates.map((p) => (
                  <li key={p.id}>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-400">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-full bg-gray-100 p-1.5">
                          <UserCircle className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{p.fullName}</p>
                          <p className="truncate text-xs text-gray-500">{p.email}</p>
                          {p.specialty ? (
                            <p className="mt-0.5 truncate text-xs text-gray-400">{p.specialty}</p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isPending || submittingId !== null}
                        onClick={() => void handleAssign(p.id)}
                        className="shrink-0 rounded-xl bg-brand-400 px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-brand-500 disabled:opacity-50"
                      >
                        {submittingId === p.id ? 'Assigning…' : 'Assign'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 flex flex-col-reverse shrink-0 justify-end border-t border-gray-100 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
