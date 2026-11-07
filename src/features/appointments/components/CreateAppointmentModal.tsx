'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  User,
  Phone,
  FileText,
  AlertCircle,
  Info,
  Search,
} from 'lucide-react';
import type { AvailableSlot, CreateAppointmentPayload } from '../types/types';
import { useAvailableSlots, useAppointmentActions } from '../hooks/useAppointment';
import { Service } from '../../services/types/types';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';
import { useClinicSettings } from '@/src/features/settings/hooks/useClinicSettings';
import type { ProviderSelectionPolicy } from '@/src/features/settings/types/types';


const PROVIDER_POLICY_COPY: Record<
  ProviderSelectionPolicy,
  { banner: string | null; providerFallback: string }
> = {
  customer_choice: {
    banner: null,
    providerFallback: 'Assigned after booking',
  },
  auto_assign: {
    banner: 'A provider will be assigned automatically based on availability.',
    providerFallback: 'Assigned automatically',
  },
  staff_assign: {
    banner: 'No provider selection needed — clinic staff will assign one after you book.',
    providerFallback: 'Assigned by staff after booking',
  },
};

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Step = 'service-date' | 'slot' | 'details';

interface StepMeta {
  index: number;
  label: string;
}

const STEPS: Record<Step, StepMeta> = {
  'service-date': { index: 1, label: 'Service & Date' },
  slot:           { index: 2, label: 'Pick a Slot' },
  details:        { index: 3, label: 'Details' },
};

const STEP_ORDER: Step[] = ['service-date', 'slot', 'details'];

/* ─── Utils ───────────────────────────────────────────────────────────────── */
function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatSlotTime(slot: AvailableSlot): string {
  return `${slot.start} – ${slot.end}`;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}


interface SlotTimeGroup {
  start: string;
  end: string;
  slots: AvailableSlot[];
}

function groupSlotsByTime(slots: AvailableSlot[]): SlotTimeGroup[] {
  const byStart = new Map<string, SlotTimeGroup>();
  for (const slot of slots) {
    const existing = byStart.get(slot.start);
    if (existing) {
      existing.slots.push(slot);
    } else {
      byStart.set(slot.start, { start: slot.start, end: slot.end, slots: [slot] });
    }
  }
  return Array.from(byStart.values()).sort((a, b) => a.start.localeCompare(b.start));
}

const TIME_OF_DAY_ORDER = ['Morning', 'Afternoon', 'Evening'] as const;

function timeOfDayLabel(start: string): (typeof TIME_OF_DAY_ORDER)[number] {
  const hour = Number(start.split(':')[0]);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

/** Buckets time-groups under Morning/Afternoon/Evening headers, in that order. */
function bucketByTimeOfDay(groups: SlotTimeGroup[]): { label: string; groups: SlotTimeGroup[] }[] {
  const buckets = new Map<string, SlotTimeGroup[]>();
  for (const group of groups) {
    const label = timeOfDayLabel(group.start);
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(group);
  }
  return TIME_OF_DAY_ORDER.filter((label) => buckets.has(label)).map((label) => ({
    label,
    groups: buckets.get(label)!,
  }));
}

/** Defensively strips trailing punctuation/whitespace from provider names —
 * seed/incomplete profile data sometimes trails off with stray dots. */
function cleanProviderName(name: string): string {
  return name.trim().replace(/[.\s]+$/, '');
}

function providerInitials(name: string): string {
  const parts = cleanProviderName(name).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

function isSameSlot(a: AvailableSlot | null, b: AvailableSlot): boolean {
  return !!a && a.start === b.start && a.provider?._id === b.provider?._id;
}

interface ProviderOption {
  id: string;
  name: string;
}

/** Unique providers across the day's slots, sorted alphabetically. */
function getDistinctProviders(slots: AvailableSlot[]): ProviderOption[] {
  const byId = new Map<string, string>();
  for (const slot of slots) {
    if (slot.provider) byId.set(slot.provider._id, cleanProviderName(slot.provider.name));
  }
  return Array.from(byId.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

/* Step indicator */
function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS[current].index;
  return (
    <div className="flex items-center gap-0">
      {STEP_ORDER.map((step, i) => {
        const meta = STEPS[step];
        const done = meta.index < currentIdx;
        const active = meta.index === currentIdx;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  done
                    ? 'bg-gold-400 text-gray-900'
                    : active
                      ? 'bg-brand-400 text-gray-900 ring-4 ring-brand-400/20'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : meta.index}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  active || done ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {meta.label}
              </span>
            </div>
            {i < STEP_ORDER.length - 1 && (
              <div
                // Tracks the "done" step's color, not the current step's —
                // this line only lights up for a step boundary that's
                // actually been passed already (see the <= comparison
                // below), never for the step you're currently on. A pale
                // fill works for the circle (dark text on top carries the
                // contrast), but a 1px line needs a more saturated tone of
                // the same hue to actually be visible.
                className={`mx-2 mb-4 h-px w-12 transition-colors ${
                  STEPS[STEP_ORDER[i + 1]].index <= currentIdx ? 'bg-gold-700' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Slot card */
function SlotCard({
  slot,
  selected,
  onSelect,
}: {
  slot: AvailableSlot;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-150 ${
        selected
          ? 'border-brand-400 bg-brand-400 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <span className="text-sm font-semibold text-gray-900">
        {slot.start}
      </span>
      <span className={`mt-0.5 text-[11px] ${selected ? 'text-gray-700' : 'text-gray-400'}`}>
        until {slot.end}
      </span>
      {slot.provider && (
        <span
          className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
            selected ? 'bg-gray-900/10 text-gray-900' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {slot.provider.name.split(' ')[0]}
        </span>
      )}
    </button>
  );
}

/** Above which provider count a search box narrows the pill bar itself. */
const PROVIDER_SEARCH_THRESHOLD = 8;

/**
 * Lets the customer pick a provider up front — the day's times only show
 * once someone is picked, so there's never a repeated-name wall to scan.
 */
function ProviderFilterBar({
  providers,
  selectedProviderId,
  onSelect,
}: {
  providers: ProviderOption[];
  selectedProviderId: string | null;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const showSearch = providers.length > PROVIDER_SEARCH_THRESHOLD;
  const trimmed = search.trim().toLowerCase();
  const visible = showSearch && trimmed
    ? providers.filter((p) => p.name.toLowerCase().includes(trimmed))
    : providers;

  return (
    <div>
      {showSearch && (
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search providers…"
            className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
          />
        </div>
      )}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {visible.map((p) => {
          const selected = selectedProviderId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition-colors ${
                selected
                  ? 'border-brand-400 bg-brand-400 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${
                  selected ? 'bg-gray-900/10 text-gray-900' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {providerInitials(p.name)}
              </span>
              {p.name}
            </button>
          );
        })}
        {showSearch && visible.length === 0 && (
          <span className="shrink-0 py-1.5 text-xs text-gray-400">No providers match your search.</span>
        )}
      </div>
    </div>
  );
}

/**
 * A plain time button used once a specific provider is selected — no need
 * to repeat their name on every row anymore, so this reads just like the
 * original flat slot grid.
 */
function SingleProviderSlotButton({
  group,
  isEarliest,
  selected,
  onSelect,
}: {
  group: SlotTimeGroup;
  isEarliest: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-150 ${
        selected
          ? 'border-brand-400 bg-brand-400 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <span className="text-sm font-semibold text-gray-900">
        {group.start}
      </span>
      <span className={`mt-0.5 text-[11px] ${selected ? 'text-gray-700' : 'text-gray-400'}`}>
        until {group.end}
      </span>
      {isEarliest && (
        <span
          className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
            selected ? 'bg-gray-900/10 text-gray-900' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          Earliest
        </span>
      )}
    </button>
  );
}

/* Field wrapper */
function Field({
  label,
  icon: Icon,
  children,
  required,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/* Error banner */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
      <p className="text-xs text-red-600">{message}</p>
    </div>
  );
}

/* Booking summary pill */
function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/* ─── Props ───────────────────────────────────────────────────────────────── */
export interface CreateAppointmentModalProps {
  open: boolean;
  clinicId: string;
  services: Service[];
  onClose: () => void;
  onBooked?: () => void;
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export function CreateAppointmentModal({
  open,
  clinicId,
  services,
  onClose,
  onBooked,
}: CreateAppointmentModalProps) {
  /* ── Step state ──────────────────────────────────────────────────────── */
  const [step, setStep] = useState<Step>('service-date');

  /* ── Form state ──────────────────────────────────────────────────────── */
  const [serviceId, setServiceId]     = useState('');
  const [date, setDate]               = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [note, setNote]               = useState('');
  const [formError, setFormError]     = useState<string | null>(null);
  // null = no provider chosen yet (prompts the picker); once set, only that
  // provider's own times are shown.
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  /* ── Data / mutations ────────────────────────────────────────────────── */
  const { slots, isLoading: slotsLoading, isError: slotsError } = useAvailableSlots(
    clinicId,
    serviceId,
    date
  );

  const { createAppointment, isCreating } = useAppointmentActions(clinicId);

  // Governs whether the customer's chosen slot's provider is honored, or the
  // provider is left for the system/staff to resolve after booking — mirrors
  // the backend's doctorSelectionPolicy branching in createAppointment.
  const { clinicSettings } = useClinicSettings(clinicId);
  const providerSelectionPolicy: ProviderSelectionPolicy =
    clinicSettings?.doctorSelectionPolicy ?? 'customer_choice';
  const policyCopy = PROVIDER_POLICY_COPY[providerSelectionPolicy];

  /* ── Reset on close ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('service-date');
        setServiceId('');
        setDate('');
        setSelectedSlot(null);
        setPhoneNumber('');
        setNote('');
        setFormError(null);
        setSelectedProviderId(null);
      }, 200); // wait for close animation
    }
  }, [open]);

  // customer_choice clinics return one slot per (time, provider) pair — a
  // provider must be picked before any time shows. Skip that extra click
  // when there's only one provider to begin with.
  useEffect(() => {
    if (!open || providerSelectionPolicy !== 'customer_choice' || selectedProviderId) return;
    const providers = getDistinctProviders(slots);
    if (providers.length === 1) setSelectedProviderId(providers[0].id);
  }, [open, providerSelectionPolicy, slots, selectedProviderId]);

  if (!open) return null;

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const selectedService = services.find((s) => s.id === serviceId);
  const currentStepIdx  = STEPS[step].index;

  const isCustomerChoiceGrouping =
    providerSelectionPolicy === 'customer_choice' && slots.some((s) => s.provider);
  const distinctProviders = isCustomerChoiceGrouping ? getDistinctProviders(slots) : [];
  const providerNotYetChosen = isCustomerChoiceGrouping && !selectedProviderId;

  // Times only ever come from a chosen provider's own slots now — there's no
  // more "everyone mixed together" view.
  const providerFilteredSlots = selectedProviderId
    ? slots.filter((s) => s.provider?._id === selectedProviderId)
    : [];

  const timeSlotGroups = groupSlotsByTime(providerFilteredSlots);
  const timeOfDaySections = bucketByTimeOfDay(timeSlotGroups);
  const earliestStart = timeSlotGroups[0]?.start;
  const selectedProviderName = distinctProviders.find((p) => p.id === selectedProviderId)?.name;
  const noTimesForSelectedProvider =
    isCustomerChoiceGrouping && !!selectedProviderId && timeSlotGroups.length === 0;

  /* ── Navigation ──────────────────────────────────────────────────────── */
  const goTo = (s: Step) => {
    setFormError(null);
    setStep(s);
  };

  const handleNextFromServiceDate = () => {
    if (!serviceId) { setFormError('Please select a service.'); return; }
    if (!date)      { setFormError('Please select a date.'); return; }
    goTo('slot');
  };

  const handleNextFromSlot = () => {
    if (!selectedSlot) { setFormError('Please select a time slot.'); return; }
    goTo('details');
  };

  const handleBack = () => {
    setFormError(null);
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  /* ── Submit ──────────────────────────────────────────────────────────── */
  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setFormError(null);

    const payload: CreateAppointmentPayload = {
      serviceId,
      date,
      start: selectedSlot.start,
      // Only meaningful for customer_choice — auto_assign/staff_assign
      // clinics never surface a provider on the slot, so this is naturally
      // omitted for them.
      providerId: providerSelectionPolicy === 'customer_choice' ? selectedSlot.provider?._id : undefined,
      notes: note.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
    };

    try {
      await createAppointment(payload);
      onBooked?.();
      onClose();
    } catch {
      setFormError('Failed to book appointment. Please try again.');
    }
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  return createPortal(
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_CLASS}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 pb-4 pt-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Appointment</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Book a service slot for a customer
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Step indicator ──────────────────────────────────────────── */}
        <div className="flex justify-center border-b border-gray-100 py-4">
          <StepIndicator current={step} />
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">

          {/* ── STEP 1 — Service & Date ─────────────────────────────── */}
          {step === 'service-date' && (
            <>
              <Field label="Service" icon={CheckCircle2} required>
                <select
                  value={serviceId}
                  onChange={(e) => { setServiceId(e.target.value); setSelectedSlot(null); setSelectedProviderId(null); }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                >
                  <option value="">Select a service…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Date" icon={Calendar} required>
                <input
                  type="date"
                  value={date}
                  min={todayIso()}
                  onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); setSelectedProviderId(null); }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                />
              </Field>
            </>
          )}

          {/* ── STEP 2 — Slot picker ────────────────────────────────── */}
          {step === 'slot' && (
            <>
              {/* Context pills */}
              <div className="grid grid-cols-2 gap-2">
                <SummaryPill label="Service" value={selectedService?.name ?? '—'} />
                <SummaryPill label="Date" value={formatDisplayDate(date)} />
              </div>

              {/* Provider selection policy banner */}
              {policyCopy.banner && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <p className="text-xs text-blue-700">{policyCopy.banner}</p>
                </div>
              )}

              {/* Slots */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  {isCustomerChoiceGrouping
                    ? selectedProviderId
                      ? `${selectedProviderName}'s available slots`
                      : 'Choose a provider'
                    : 'Available time slots'}
                </p>

                {/* Provider picker — pick who first, then see just their times. */}
                {isCustomerChoiceGrouping && distinctProviders.length > 1 && (
                  <div className="mb-3">
                    <ProviderFilterBar
                      providers={distinctProviders}
                      selectedProviderId={selectedProviderId}
                      onSelect={setSelectedProviderId}
                    />
                  </div>
                )}

                {slotsLoading && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-10 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available slots…
                  </div>
                )}

                {!slotsLoading && slotsError && (
                  <ErrorBanner message="Could not load available slots. Please try again." />
                )}

                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                    <Clock className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">No slots available</p>
                    <p className="mt-1 text-xs text-gray-400">Try a different date or service</p>
                  </div>
                )}

                {!slotsLoading && !slotsError && slots.length > 0 && providerNotYetChosen && (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                    <User className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Select a provider to see their available times</p>
                  </div>
                )}

                {!slotsLoading && !slotsError && slots.length > 0 && noTimesForSelectedProvider && (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                    <Clock className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">
                      No open times for {selectedProviderName} on this date
                    </p>
                    {distinctProviders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedProviderId(null)}
                        className="mt-2 text-xs font-medium text-gray-600 underline underline-offset-2 hover:text-gray-900"
                      >
                        Choose another provider
                      </button>
                    )}
                  </div>
                )}

                {!slotsLoading && !slotsError && slots.length > 0 && !providerNotYetChosen && !noTimesForSelectedProvider && (
                  isCustomerChoiceGrouping ? (
                    <div className="space-y-4">
                      {timeOfDaySections.map(({ label, groups }) => (
                        <div key={label}>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            {label}
                          </p>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {groups.map((group) => (
                              <SingleProviderSlotButton
                                key={group.start}
                                group={group}
                                isEarliest={group.start === earliestStart}
                                selected={isSameSlot(selectedSlot, group.slots[0])}
                                onSelect={() => { setSelectedSlot(group.slots[0]); setFormError(null); }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((slot) => (
                        <SlotCard
                          key={`${slot.start}-${slot.provider?._id ?? 'unassigned'}`}
                          slot={slot}
                          selected={isSameSlot(selectedSlot, slot)}
                          onSelect={() => { setSelectedSlot(slot); setFormError(null); }}
                        />
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Selected slot confirmation strip */}
              {selectedSlot && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <p className="text-xs text-emerald-700">
                    <span className="font-semibold">{formatSlotTime(selectedSlot)}</span>
                    {selectedSlot.provider && (
                      <>
                        {' '}with{' '}
                        <span className="font-semibold">{selectedSlot.provider.name}</span>
                      </>
                    )}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── STEP 3 — Details ────────────────────────────────────── */}
          {step === 'details' && (
            <>
              {/* Booking summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <SummaryPill label="Service" value={selectedService?.name ?? '—'} />
                <SummaryPill label="Date" value={formatDisplayDate(date)} />
                <SummaryPill label="Time" value={selectedSlot ? formatSlotTime(selectedSlot) : '—'} />
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Provider</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  {selectedSlot?.provider?.name ?? policyCopy.providerFallback}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-2" />

              <Field label="Phone Number" icon={Phone}>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 01112388909"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                />
              </Field>

              <Field label="Note" icon={FileText}>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Any special notes for the appointment…"
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                />
              </Field>
            </>
          )}

          {/* ── Error ────────────────────────────────────────────────── */}
          {formError && <ErrorBanner message={formError} />}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse items-center justify-between border-t border-gray-100 px-6 py-4 sm:flex-row">
          {/* Back button */}
          {currentStepIdx > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          )}

          {/* Primary action */}
          {step === 'service-date' && (
            <button
              type="button"
              onClick={handleNextFromServiceDate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
            >
              Check Availability
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {step === 'slot' && (
            <button
              type="button"
              onClick={handleNextFromSlot}
              disabled={!selectedSlot}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {step === 'details' && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isCreating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Booking…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Booking
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}