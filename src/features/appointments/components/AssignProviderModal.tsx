'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, UserCircle, Search, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import type { Appointment } from '../types/types';
import { useAvailableProvidersForAppointment } from '../hooks/useAppointment';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';

/** Scroll viewport ≈ five provider rows (card + gap) so the dialog stays compact. */
const PROVIDER_LIST_MAX_HEIGHT = 'max-h-[min(27.5rem,calc(90dvh-14rem))]';

interface AssignProviderModalProps {
  open: boolean;
  appointment: Appointment | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onAssign: (providerId: string) => void | Promise<void>;
}

export const AssignProviderModal = ({
  open,
  appointment,
  isSubmitting = false,
  onClose,
  onAssign,
}: AssignProviderModalProps) => {
  const [query, setQuery] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Eligible providers are scoped to this specific appointment (working
  // hours / blocks / conflicts at its exact slot already filtered
  // server-side) — not just "everyone on the clinic roster".
  const {
    providers,
    isLoading: providersLoading,
    isError: providersError,
  } = useAvailableProvidersForAppointment(open ? appointment?.id ?? null : null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSubmittingId(null);
    }
  }, [open, appointment?.id]);

  // Return focus to whatever triggered the modal once it closes, instead of
  // leaving it on `document.body` (or nowhere) for keyboard/AT users.
  useEffect(() => {
    if (!open) return;
    const triggerElement = document.activeElement as HTMLElement | null;
    return () => triggerElement?.focus?.();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isSubmitting, onClose]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        (p.email?.toLowerCase().includes(q) ?? false) ||
        (p.specialty?.toLowerCase().includes(q) ?? false)
    );
  }, [providers, query]);

  if (!open || !appointment) return null;

  const handleAssign = async (providerId: string) => {
    setSubmittingId(providerId);
    try {
      await onAssign(providerId);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div
        className={`${MODAL_PANEL_CLASS} min-h-0`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-provider-modal-title"
        aria-describedby="assign-provider-modal-description"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 pb-3 pt-6">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <h2 id="assign-provider-modal-title" className="text-sm font-semibold text-gray-900">Assign Provider</h2>
                <p id="assign-provider-modal-description" className="mt-0.5 text-xs text-gray-500">
                  Choose who will handle this appointment.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="shrink-0 rounded-lg p-2.5 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-col px-6 pb-6 pt-4">
          {/* Appointment summary */}
          <div className="mb-4 shrink-0 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5 text-xs text-gray-600">
            <p className="font-medium text-gray-800 truncate">
              {appointment.service.name || 'Appointment'}
            </p>
            <p className="mt-0.5 text-gray-500">
              {appointment.date} · {appointment.start} – {appointment.end}
            </p>
            {appointment.customer.fullName && (
              <p className="mt-0.5 truncate text-gray-500">
                Customer: {appointment.customer.fullName}
              </p>
            )}
          </div>

          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or specialty…"
              aria-label="Search providers"
              className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>

          <div className={`mt-4 min-h-0 overflow-y-auto overscroll-contain ${PROVIDER_LIST_MAX_HEIGHT}`}>
            {providersLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-10 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading eligible providers…
              </div>
            ) : providersError ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                <p className="text-xs text-red-600">Could not load eligible providers. Please try again.</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center px-4">
                <p className="text-sm text-gray-600">
                  {providers.length === 0
                    ? 'No providers are eligible for this slot — everyone qualified is either off, blocked, or already booked then.'
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
                          {p.email && <p className="truncate text-xs text-gray-500">{p.email}</p>}
                          {p.specialty ? (
                            <p className="mt-0.5 truncate text-xs text-gray-400">{p.specialty}</p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isSubmitting || submittingId !== null}
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
              disabled={isSubmitting}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
