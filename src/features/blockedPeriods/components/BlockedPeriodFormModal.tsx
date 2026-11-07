'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Ban, Building2, SearchCheck, Sparkles, User, X } from 'lucide-react';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';
import { useToast } from '@/src/components/ui/ToastProvider';
import { getApiErrorMessage } from '@/src/utils/helpers';
import {
  useCreateBlockedPeriodMutation,
  useUpdateBlockedPeriodMutation,
} from '../hooks/useBlockedPeriods';
import { getBlockedPeriodConflictInfo } from '../utils/conflictError';
import {
  getBlockScope,
  scopeToTargetIds,
  scopeToTargetPairs,
  type BlockScope,
  type TargetPair,
} from '../utils/scope';
import { BlockedPeriodConflictsModal } from './BlockedPeriodConflictsModal';
import { CheckConflictsModal } from './CheckConflictsModal';
import { SegmentedTabs, type SegmentedTabOption } from '@/src/components/ui/SegmentedTabs';
import { EntityPicker } from '@/src/components/ui/EntityPicker';
import type {
  BlockedPeriod,
  BlockedPeriodConflictsPayload,
  CreateBlockedPeriodPayload,
  UpdateBlockedPeriodPayload,
} from '../types/types';
import type { ClinicStaffMember } from '@/src/features/staff/types/types';
import type { Service } from '@/src/features/services/types/types';

interface BlockedPeriodFormModalProps {
  open: boolean;
  clinicId: string;
  /** null = create mode. */
  blockedPeriod: BlockedPeriod | null;
  providers: ClinicStaffMember[];
  services: Service[];
  providersUnavailable?: boolean;
  servicesUnavailable?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** A conflict paused mid-batch — which target it was for, and where to resume from if forced/cancelled. */
interface PendingConflict {
  conflictsCount: number;
  targets: TargetPair[];
  resumeIndex: number;
}

function summarizeNames(ids: string[], namesById: Map<string, string>, noun: string): string {
  if (ids.length === 0) return `Select a ${noun} below`;
  const names = ids.map((id) => namesById.get(id) ?? id);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} +${names.length - 2} more`;
}

function describeTarget(
  target: TargetPair,
  providerNamesById: Map<string, string>,
  serviceNamesById: Map<string, string>
): string {
  const providerName = target.providerId ? providerNamesById.get(target.providerId) ?? 'Provider' : null;
  const serviceName = target.serviceId ? serviceNamesById.get(target.serviceId) ?? 'Service' : null;
  if (providerName && serviceName) return `${providerName} — ${serviceName}`;
  if (providerName) return providerName;
  if (serviceName) return serviceName;
  return 'Entire clinic';
}

export function BlockedPeriodFormModal({
  open,
  clinicId,
  blockedPeriod,
  providers,
  services,
  providersUnavailable,
  servicesUnavailable,
  onClose,
  onSaved,
}: BlockedPeriodFormModalProps) {
  const isEdit = Boolean(blockedPeriod);
  const { showSuccess, showError } = useToast();

  const [scope, setScope] = useState<BlockScope>(() =>
    getBlockScope(blockedPeriod ?? { providerId: null, serviceId: null })
  );
  // Multi-select on create (fans out into one record per id — the backend
  // has no array field, so N services selected literally means N API
  // calls). Edit always operates on the one existing record, so its
  // toggle handlers below constrain these back down to length ≤ 1.
  const [providerIds, setProviderIds] = useState<string[]>(blockedPeriod?.providerId ? [blockedPeriod.providerId] : []);
  const [serviceIds, setServiceIds] = useState<string[]>(blockedPeriod?.serviceId ? [blockedPeriod.serviceId] : []);
  const [date, setDate] = useState(blockedPeriod?.date ?? '');
  const [allDay, setAllDay] = useState(blockedPeriod?.allDay ?? false);
  const [start, setStart] = useState(blockedPeriod && !blockedPeriod.allDay ? blockedPeriod.start : '09:00');
  const [end, setEnd] = useState(blockedPeriod && !blockedPeriod.allDay ? blockedPeriod.end : '17:00');
  const [reason, setReason] = useState(blockedPeriod?.reason ?? '');
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null);
  const [submitProgress, setSubmitProgress] = useState<{ done: number; total: number } | null>(null);
  // Proactive, on-demand check — distinct from `pendingConflict`, which only
  // ever gets set reactively after a create/update call itself 409s.
  const [checkConflictsOpen, setCheckConflictsOpen] = useState(false);
  // Flipped when the user closes the modal while a create batch is still
  // fanning out across targets — checked between iterations so the loop
  // stops issuing further requests instead of racing on after the modal
  // (and whatever state it was updating) is gone.
  const abortedRef = useRef(false);

  // Silent: a multi-target batch shows one consolidated toast at the end
  // instead of one per record created.
  const { createBlockedPeriodAsync, isPending: isCreating } = useCreateBlockedPeriodMutation(clinicId, {
    silent: true,
  });
  const { updateBlockedPeriodAsync, isPending: isUpdating } = useUpdateBlockedPeriodMutation(clinicId);
  const isSubmitting = isCreating || isUpdating;

  const toggleProvider = (id: string) => {
    setProviderIds((prev) => (isEdit ? (prev[0] === id ? [] : [id]) : prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleService = (id: string) => {
    setServiceIds((prev) => (isEdit ? (prev[0] === id ? [] : [id]) : prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Routes every user-initiated close (X, Cancel, Escape) through here so a
  // close mid-batch also flips `abortedRef` — see its declaration above.
  const handleClose = () => {
    abortedRef.current = true;
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        abortedRef.current = true;
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Return focus to whatever triggered the modal once it closes, instead of
  // leaving it on `document.body` (or nowhere) for keyboard/AT users.
  useEffect(() => {
    if (!open) return;
    const triggerElement = document.activeElement as HTMLElement | null;
    return () => triggerElement?.focus?.();
  }, [open]);

  const providerNamesById = useMemo(() => new Map(providers.map((p) => [p.id, p.fullName])), [providers]);
  const serviceNamesById = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);

  if (!open) return null;

  const timeScope = { date, allDay, ...(allDay ? {} : { start, end }) };
  const timeRangeError = !allDay && Boolean(start) && Boolean(end) && start >= end;

  const missingTarget =
    (scope === 'provider' && providerIds.length === 0) ||
    (scope === 'service' && serviceIds.length === 0) ||
    (scope === 'providerService' && (providerIds.length === 0 || serviceIds.length === 0));
  const canSubmit = Boolean(date) && !missingTarget && !timeRangeError;

  const targetPairs = scopeToTargetPairs(scope, providerIds, serviceIds);

  const scopeOptions: SegmentedTabOption<BlockScope>[] = [
    { value: 'clinic', label: 'Entire clinic', icon: Building2 },
    {
      value: 'provider',
      label: 'A provider',
      icon: User,
      disabledReason: providers.length
        ? undefined
        : providersUnavailable
        ? 'Provider list unavailable right now'
        : 'No providers in this clinic yet',
    },
    {
      value: 'service',
      label: 'A service',
      icon: Sparkles,
      disabledReason: services.length
        ? undefined
        : servicesUnavailable
        ? 'Service list unavailable right now'
        : 'No services in this clinic yet',
    },
    {
      value: 'providerService',
      label: 'Provider + service',
      icon: Ban,
      disabledReason:
        providers.length && services.length
          ? undefined
          : 'Needs both a provider and a service in this clinic',
    },
  ];

  const SummaryIcon = scope === 'provider' ? User : scope === 'service' ? Sparkles : scope === 'providerService' ? Ban : Building2;
  const targetSummary =
    scope === 'provider'
      ? summarizeNames(providerIds, providerNamesById, 'provider')
      : scope === 'service'
      ? summarizeNames(serviceIds, serviceNamesById, 'service')
      : scope === 'providerService'
      ? `${summarizeNames(providerIds, providerNamesById, 'provider')} × ${summarizeNames(serviceIds, serviceNamesById, 'service')}`
      : 'Entire clinic';
  const timeSummary = !date
    ? 'Pick a date below'
    : allDay
    ? `${date} · All day`
    : `${date} · ${start}–${end}`;

  // Create path: sequential fan-out over every target pair. Sequential
  // (not parallel) so a 409 on item 2 doesn't leave items 3+ racing ahead
  // while the conflict modal is paused waiting on the user.
  const runCreateBatch = async (targets: TargetPair[], startIndex: number, forceCurrent: boolean) => {
    abortedRef.current = false;
    let succeeded = startIndex;
    for (let i = startIndex; i < targets.length; i++) {
      if (abortedRef.current) return;
      setSubmitProgress({ done: succeeded, total: targets.length });
      const target = targets[i];
      try {
        const payload: CreateBlockedPeriodPayload = {
          ...(target.providerId ? { providerIds: [target.providerId] } : {}),
          ...(target.serviceId ? { serviceIds: [target.serviceId] } : {}),
          reason: reason.trim() || undefined,
          ...timeScope,
          ...(forceCurrent && i === startIndex ? { force: true } : {}),
        };
        await createBlockedPeriodAsync(payload);
        if (abortedRef.current) return;
        succeeded += 1;
      } catch (err) {
        if (abortedRef.current) return;
        const conflict = getBlockedPeriodConflictInfo(err);
        setSubmitProgress(null);
        if (conflict) {
          setPendingConflict({ conflictsCount: conflict.conflictsCount, targets, resumeIndex: i });
          return;
        }
        // Surface the backend's actual message (e.g. "An identical blocked
        // period already exists") instead of a generic fallback — createBlockedPeriodAsync
        // is `silent`, so this is the only place that error reaches the user.
        const backendMessage = getApiErrorMessage(err, 'Failed to create the blocked period.');
        showError(
          succeeded > 0
            ? `Stopped after ${succeeded} of ${targets.length} — ${backendMessage}`
            : backendMessage,
          'Create failed'
        );
        // Some records already saved before this one failed — treat it like
        // any other exit: refresh the list and close, rather than leaving a
        // half-saved batch sitting behind an open form.
        if (succeeded > 0) {
          onSaved();
          onClose();
        }
        return;
      }
    }
    if (abortedRef.current) return;
    setSubmitProgress(null);
    setPendingConflict(null);
    showSuccess(
      targets.length > 1 ? `${succeeded} blocked periods created.` : 'Blocked period created.',
      'Blocked period saved'
    );
    onSaved();
    onClose();
  };

  // Edit path: always exactly one existing record — same single-item
  // submit/conflict flow this modal always had.
  const submitEdit = async (force: boolean) => {
    if (!blockedPeriod) return;
    const targetIds = scopeToTargetIds(scope, providerIds[0] ?? null, serviceIds[0] ?? null);
    try {
      const payload: UpdateBlockedPeriodPayload = {
        ...targetIds,
        reason: reason.trim() || null,
        ...timeScope,
        ...(force ? { force: true } : {}),
      };
      await updateBlockedPeriodAsync({ id: blockedPeriod.id, payload });
      setPendingConflict(null);
      onSaved();
      onClose();
    } catch (err) {
      const conflict = getBlockedPeriodConflictInfo(err);
      if (conflict) {
        setPendingConflict({ conflictsCount: conflict.conflictsCount, targets: [targetIds], resumeIndex: 0 });
      }
      // Any other error already surfaced a toast via the mutation's onError.
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (isEdit) {
      void submitEdit(false);
    } else {
      void runCreateBatch(targetPairs, 0, false);
    }
  };

  const handleConflictForceSave = () => {
    if (!pendingConflict) return;
    if (isEdit) {
      void submitEdit(true);
    } else {
      void runCreateBatch(pendingConflict.targets, pendingConflict.resumeIndex, true);
    }
  };

  const handleConflictCancel = () => {
    if (!pendingConflict) return;
    const { targets, resumeIndex } = pendingConflict;
    setPendingConflict(null);
    // Some records in this batch already saved before the conflict paused
    // it — report that honestly and refresh, rather than silently
    // discarding the fact that N of M did go through.
    if (!isEdit && resumeIndex > 0) {
      showSuccess(`${resumeIndex} of ${targets.length} blocked periods created before you stopped.`, 'Partially saved');
      onSaved();
      onClose();
    }
  };

  const submitLabel = isSubmitting
    ? submitProgress
      ? `Creating ${submitProgress.done + 1} of ${submitProgress.total}…`
      : 'Saving…'
    : isEdit
    ? 'Save changes'
    : targetPairs.length > 1
    ? `Create ${targetPairs.length} blocked periods`
    : 'Create blocked period';

  // What the "Check for conflicts" button previews — every currently
  // selected provider/service (the full multi-select arrays, not narrowed to
  // one target the way the reactive post-409 flow's payload is), so a batch
  // of several providers/services gets checked in one shot. A dimension not
  // part of the current scope is left out of the payload entirely.
  const conflictsPreviewPayload: Omit<BlockedPeriodConflictsPayload, 'page' | 'limit'> = {
    ...timeScope,
    ...((scope === 'provider' || scope === 'providerService') && providerIds.length
      ? { providerIds }
      : {}),
    ...((scope === 'service' || scope === 'providerService') && serviceIds.length
      ? { serviceIds }
      : {}),
    ...(isEdit && blockedPeriod ? { excludeBlockedPeriodId: blockedPeriod.id } : {}),
  };

  // The one target the paused batch is currently asking about — the
  // conflicts-preview endpoint takes providerIds/serviceIds as arrays (a
  // real API detail distinct from create/update's singular fields), so a
  // single target becomes a one-element array; an unset dimension is left
  // out of the payload entirely rather than sent as `[]`.
  const pendingTarget = pendingConflict?.targets[pendingConflict.resumeIndex];

  return (
    <>
      <div className={MODAL_OVERLAY_CLASS}>
        <div
          className={MODAL_PANEL_CLASS}
          role="dialog"
          aria-modal="true"
          aria-labelledby="blocked-period-modal-title"
          aria-describedby="blocked-period-modal-description"
        >
          <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 pb-3 pt-6">
            <div>
              <h2 id="blocked-period-modal-title" className="text-lg font-semibold text-gray-900">
                {isEdit ? 'Edit blocked period' : 'New blocked period'}
              </h2>
              <p id="blocked-period-modal-description" className="mt-1 text-sm text-gray-500">
                Closes a date/time range to bookings. Choose what it applies to first.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="shrink-0 rounded-lg p-2.5 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">What are you blocking?</label>
                <SegmentedTabs
                  options={scopeOptions}
                  value={scope}
                  onChange={setScope}
                  ariaLabel="What are you blocking"
                  fitContent
                />
              </div>

              {scope === 'providerService' && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This provider becomes unavailable for this service only — the service stays bookable with
                  other providers, and this provider stays available for other services.
                </p>
              )}

              {(scope === 'provider' || scope === 'providerService') && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-700">
                    {isEdit ? 'Provider' : 'Provider(s)'}
                  </label>
                  <EntityPicker
                    items={providers.map((p) => ({ id: p.id, label: p.fullName }))}
                    selectedIds={providerIds}
                    onToggle={toggleProvider}
                    multiple={!isEdit}
                    placeholder="Search providers…"
                    isError={providersUnavailable}
                    errorMessage="Couldn't load providers."
                    emptyMessage="No providers match your search."
                    autoFocus
                  />
                </div>
              )}

              {(scope === 'service' || scope === 'providerService') && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-700">
                    {isEdit ? 'Service' : 'Service(s)'}
                  </label>
                  <EntityPicker
                    items={services.map((s) => ({ id: s.id, label: s.name }))}
                    selectedIds={serviceIds}
                    onToggle={toggleService}
                    multiple={!isEdit}
                    placeholder="Search services…"
                    isError={servicesUnavailable}
                    errorMessage="Couldn't load services."
                    emptyMessage="No services match your search."
                    autoFocus={scope === 'service'}
                  />
                </div>
              )}

              <div
                aria-live="polite"
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tan-700 text-white">
                  <SummaryIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{targetSummary}</p>
                  <p className="text-xs text-gray-500">{timeSummary}</p>
                </div>
                {!isEdit && targetPairs.length > 1 && (
                  <span className="ml-auto shrink-0 rounded-full bg-tan-700 px-2.5 py-1 text-xs font-semibold text-white">
                    {targetPairs.length} blocks
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="blocked-period-date" className="block text-xs font-medium text-gray-700">Date</label>
                <input
                  id="blocked-period-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-brand-400"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <span className="text-sm text-gray-800">All day</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allDay}
                  onClick={() => setAllDay((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    allDay ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      allDay ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {!allDay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="blocked-period-start" className="block text-xs font-medium text-gray-700">Start</label>
                    <input
                      id="blocked-period-start"
                      type="time"
                      required
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="blocked-period-end" className="block text-xs font-medium text-gray-700">End</label>
                    <input
                      id="blocked-period-end"
                      type="time"
                      required
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      aria-describedby={timeRangeError ? 'blocked-period-end-error' : undefined}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    />
                    {timeRangeError && (
                      <p id="blocked-period-end-error" className="text-xs text-red-600">End time must be after start time.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="blocked-period-reason" className="block text-xs font-medium text-gray-700">Reason (optional)</label>
                <textarea
                  id="blocked-period-reason"
                  rows={3}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Public holiday, equipment maintenance…"
                  className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setCheckConflictsOpen(true)}
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SearchCheck className="h-4 w-4" />
                Check for conflicts
              </button>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !canSubmit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
                >
                  {submitLabel}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <BlockedPeriodConflictsModal
        open={Boolean(pendingConflict)}
        clinicId={clinicId}
        conflictsCount={pendingConflict?.conflictsCount ?? 0}
        payload={{
          ...(pendingTarget?.providerId ? { providerIds: [pendingTarget.providerId] } : {}),
          ...(pendingTarget?.serviceId ? { serviceIds: [pendingTarget.serviceId] } : {}),
          ...timeScope,
        }}
        targetLabel={
          pendingTarget
            ? describeTarget(pendingTarget, providerNamesById, serviceNamesById)
            : undefined
        }
        progress={
          pendingConflict && pendingConflict.targets.length > 1
            ? { current: pendingConflict.resumeIndex + 1, total: pendingConflict.targets.length }
            : undefined
        }
        isSaving={isSubmitting}
        onCancel={handleConflictCancel}
        onForceSave={handleConflictForceSave}
      />

      <CheckConflictsModal
        open={checkConflictsOpen}
        clinicId={clinicId}
        payload={conflictsPreviewPayload}
        onClose={() => setCheckConflictsOpen(false)}
      />
    </>
  );
}
