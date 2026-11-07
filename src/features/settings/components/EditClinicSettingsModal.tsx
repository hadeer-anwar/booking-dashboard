'use client';

import { X, Clock, CalendarClock, Calendar, RefreshCw, Shield, Save, AlertCircle, CheckCircle2, HelpCircle, Users } from 'lucide-react';
import { useState } from "react";
import type { AvailabilityReleasePolicy, ClinicSettings, ProviderSelectionPolicy } from '@/src/features/settings/types/types';
import { useUpdateClinicSettings } from '@/src/features/settings/hooks/useClinicSettings';
import { cn } from "@/src/utils/helpers";
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_SCROLL_CLASS } from "@/src/components/ui/modal-shell";
import { SegmentedTabs, type SegmentedTabOption } from "@/src/components/ui/SegmentedTabs";

type SettingsSection = 'buffer' | 'provider' | 'cancellation' | 'reschedule' | 'booking';

// One tab per section instead of stacking all five as separate cards — pick
// what to edit, see just that. Same "choose, then see only that" pattern as
// blocked periods' scope picker (SegmentedTabs is the same shared component).
const SECTION_OPTIONS: SegmentedTabOption<SettingsSection>[] = [
  { value: 'buffer', label: 'Buffer', icon: Clock },
  { value: 'provider', label: 'Provider', icon: Users },
  { value: 'cancellation', label: 'Cancellation', icon: Calendar },
  { value: 'reschedule', label: 'Reschedule', icon: RefreshCw },
  { value: 'booking', label: 'Booking', icon: Shield },
];

const RELEASE_POLICY_OPTIONS: {
  value: AvailabilityReleasePolicy;
  label: string;
  description: string;
}[] = [
  {
    value: 'rolling_window',
    label: 'Rolling window',
    description: 'Customers can always book up to a fixed number of days ahead — the window slides forward every day.',
  },
  {
    value: 'monthly_release',
    label: 'Day of month',
    description: 'Bookings stay open through the end of the current month; the next month opens on a day you pick.',
  },
  {
    value: 'fully_open',
    label: 'Fully open',
    description: 'No fixed horizon — customers can book any date up to a year ahead.',
  },
];

const PROVIDER_SELECTION_OPTIONS: {
  value: ProviderSelectionPolicy;
  label: string;
  description: string;
}[] = [
  {
    value: 'customer_choice',
    label: 'Customer chooses',
    description: 'Customers pick their preferred provider when booking a service.',
  },
  {
    value: 'auto_assign',
    label: 'Auto-assign',
    description: 'The system automatically assigns the best available provider.',
  },
  {
    value: 'staff_assign',
    label: 'Staff assigns',
    description: 'The booking is left unassigned — your staff assigns a provider afterward.',
  },
];

export const EditClinicSettingsModal = ({
  isOpen,
  onClose,
  clinicId,
  initialSettings,
}: {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  initialSettings: ClinicSettings;
}) => {
  const [formData, setFormData] = useState<ClinicSettings | null>(
    initialSettings ?? null,
  );
  const { updateClinicSettings, isPending: isUpdating } =
    useUpdateClinicSettings(clinicId);
  const [activeSection, setActiveSection] = useState<SettingsSection>('buffer');
  const [cancelType, setCancelType] = useState<"hours" | "days">("hours");
  const [showCancelTooltip, setShowCancelTooltip] = useState(false);
  const [showRescheduleTooltip, setShowRescheduleTooltip] = useState(false);
  const [showProviderPolicyTooltip, setShowProviderPolicyTooltip] = useState(false);
  const [showAvailabilityTooltip, setShowAvailabilityTooltip] = useState(false);

  if (!isOpen || !formData) return null;

  const handleSave = async () => {
    if (!formData) return;
    updateClinicSettings(formData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleCancelChange = (checked: boolean) => {
    setFormData({
      ...formData,
      allowCancelAppointment: checked,
    });
  };

  const getCancelValue = () => {
    if (cancelType === "hours") {
      return formData.appointmentCancellationTimeHours;
    }
    return formData.appointmentCancellationTimeDays;
  };

  const setCancelValue = (value: number) => {
    if (cancelType === "hours") {
      setFormData({
        ...formData,
        appointmentCancellationTimeHours: value,
        appointmentCancellationTimeDays: undefined,
      });
    } else {
      setFormData({
        ...formData,
        appointmentCancellationTimeDays: value,
        appointmentCancellationTimeHours: undefined,
      });
    }
  };

  return (
    <div
      className={cn(
        MODAL_OVERLAY_CLASS,
        "transition-all animate-in fade-in duration-200",
      )}
    >
      <div
        className={cn(
          MODAL_PANEL_SCROLL_CLASS,
          "animate-in slide-in-from-bottom-4 duration-300",
        )}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-sm px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Clinic Settings
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure appointment rules and preferences
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section picker */}
        <div className="border-b border-gray-100 px-6 py-4">
          <SegmentedTabs
            ariaLabel="Settings section"
            options={SECTION_OPTIONS}
            value={activeSection}
            onChange={setActiveSection}
            fitContent
          />
        </div>

        {/* Modal Body — only the active section renders */}
        <div className="px-6 py-6">
          {activeSection === 'buffer' && (
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="h-5 w-5 text-gray-700" />
                  Service Buffer Time
                </label>
                <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                  Recommended: 15-30 minutes
                </span>
              </div>
              <p className="mb-3 text-xs text-gray-500">
                Time needed between appointments for preparation, cleanup, and room turnover
              </p>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    step="5"
                    value={formData.serviceBufferTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serviceBufferTime: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    min
                  </div>
                </div>
                <div className="flex gap-2">
                  {[15, 30, 45].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          serviceBufferTime: time,
                        })
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.serviceBufferTime === time
                          ? "bg-gray-900 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {time}min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'provider' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-5 w-5 text-gray-700" />
                <label className="text-sm font-semibold text-gray-700">
                  Provider Selection Policy
                </label>
                <button
                  type="button"
                  className="relative"
                  onMouseEnter={() => setShowProviderPolicyTooltip(true)}
                  onMouseLeave={() => setShowProviderPolicyTooltip(false)}
                >
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  {showProviderPolicyTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 whitespace-normal px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-20">
                      Controls who ends up assigned as the provider when a customer books a service.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </button>
              </div>
              <p className="mb-3 text-xs text-gray-500">
                Decide whether customers pick their provider, the system assigns one automatically, or your staff assigns one after booking
              </p>

              <div className="space-y-2">
                {PROVIDER_SELECTION_OPTIONS.map((option) => {
                  const selected = formData.doctorSelectionPolicy === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          doctorSelectionPolicy: option.value,
                        })
                      }
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all",
                        selected
                          ? "border-gray-900 bg-white shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                          selected ? "border-gray-900 bg-gray-900" : "border-gray-300"
                        )}
                      >
                        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === 'cancellation' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-700" />
                  <label className="text-sm font-semibold text-gray-700">
                    Cancellation Policy
                  </label>
                  <button
                    type="button"
                    className="relative"
                    onMouseEnter={() => setShowCancelTooltip(true)}
                    onMouseLeave={() => setShowCancelTooltip(false)}
                  >
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    {showCancelTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-20">
                        Set cancellation deadline for customers
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 p-1">
                  <button
                    type="button"
                    onClick={() => setCancelType("hours")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      cancelType === "hours"
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelType("days")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      cancelType === "days"
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Days
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <input
                    type="checkbox"
                    id="allowCancel"
                    checked={formData.allowCancelAppointment}
                    onChange={(e) => handleCancelChange(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/20 cursor-pointer"
                  />
                  <label htmlFor="allowCancel" className="text-sm text-gray-700 cursor-pointer flex-1">
                    Allow customers to cancel appointments
                  </label>
                  {formData.allowCancelAppointment && (
                    <CheckCircle2 className="h-4 w-4 text-gray-700" />
                  )}
                </div>

                {formData.allowCancelAppointment && (
                  <div className="ml-8 animate-in slide-in-from-left-2 fade-in duration-200">
                    <label className="mb-2 block text-xs font-medium text-gray-600">
                      Cancellation deadline
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max={cancelType === "hours" ? 168 : 30}
                        step={cancelType === "hours" ? 1 : 1}
                        value={getCancelValue() ?? ''}
                        onChange={(e) => setCancelValue(parseInt(e.target.value) || 0)}
                        className="w-32 rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
                      />
                      <span className="text-sm text-gray-600">
                        {cancelType === "hours" ? "hour(s)" : "day(s)"} before appointment
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Customers must cancel at least this far in advance to avoid fees
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'reschedule' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="h-5 w-5 text-gray-700" />
                <label className="text-sm font-semibold text-gray-700">
                  Reschedule Policy
                </label>
                <button
                  type="button"
                  className="relative"
                  onMouseEnter={() => setShowRescheduleTooltip(true)}
                  onMouseLeave={() => setShowRescheduleTooltip(false)}
                >
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  {showRescheduleTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-20">
                      Limit how many times a customer can reschedule
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <input
                    type="checkbox"
                    id="allowReschedule"
                    checked={formData.allowRescheduleAppointment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowRescheduleAppointment: e.target.checked,
                      })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/20 cursor-pointer"
                  />
                  <label htmlFor="allowReschedule" className="text-sm text-gray-700 cursor-pointer flex-1">
                    Allow customers to reschedule appointments
                  </label>
                  {formData.allowRescheduleAppointment && (
                    <CheckCircle2 className="h-4 w-4 text-gray-700" />
                  )}
                </div>

                {formData.allowRescheduleAppointment && (
                  <div className="ml-8 animate-in slide-in-from-left-2 fade-in duration-200">
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <label className="mb-2 block text-xs font-medium text-gray-600">
                          Maximum reschedule attempts
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={formData.rescheduleAppointmentLimit}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                rescheduleAppointmentLimit: parseInt(e.target.value) || 1,
                              })
                            }
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                          />
                          <span className="min-w-[40px] text-center font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg text-sm">
                            {formData.rescheduleAppointmentLimit}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Number of times a customer can reschedule the same appointment
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'booking' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarClock className="h-5 w-5 text-gray-700" />
                  <label className="text-sm font-semibold text-gray-700">
                    Availability Release Policy
                  </label>
                  <button
                    type="button"
                    className="relative"
                    onMouseEnter={() => setShowAvailabilityTooltip(true)}
                    onMouseLeave={() => setShowAvailabilityTooltip(false)}
                  >
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    {showAvailabilityTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 whitespace-normal px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-20">
                        Controls how far ahead customers can see and book appointments — a fixed rolling
                        window, a monthly release date, or fully open.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </button>
                </div>
                <p className="mb-3 text-xs text-gray-500">
                  How far in advance customers can see and book appointments
                </p>

                <div className="space-y-2">
                  {RELEASE_POLICY_OPTIONS.map((option) => {
                    const selected = formData.availabilityReleasePolicy === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            availabilityReleasePolicy: option.value,
                          })
                        }
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all",
                          selected
                            ? "border-gray-900 bg-white shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                            selected ? "border-gray-900 bg-gray-900" : "border-gray-300"
                          )}
                        >
                          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-gray-900">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {option.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {formData.availabilityReleasePolicy === 'rolling_window' && (
                  <div className="mt-3 ml-8 animate-in slide-in-from-left-2 fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="365"
                        step="7"
                        value={formData.maxAdvanceBookingDays}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxAdvanceBookingDays: parseInt(e.target.value) || 1,
                          })
                        }
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                      />
                      <div className="relative shrink-0">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formData.maxAdvanceBookingDays}
                          onChange={(e) => {
                            const parsed = parseInt(e.target.value, 10);
                            const clamped = Number.isNaN(parsed) ? 1 : Math.min(365, Math.max(1, parsed));
                            setFormData({ ...formData, maxAdvanceBookingDays: clamped });
                          }}
                          className="w-24 rounded-lg border-2 border-gray-200 bg-gray-100 px-3 py-1.5 pr-11 text-right text-sm font-semibold text-gray-900 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          days
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                      <span>1 day</span>
                      <span>3 months</span>
                      <span>6 months</span>
                      <span>1 year</span>
                    </div>
                  </div>
                )}

                {formData.availabilityReleasePolicy === 'monthly_release' && (
                  <div className="mt-3 ml-8 animate-in slide-in-from-left-2 fade-in duration-200">
                    <label className="mb-2 block text-xs font-medium text-gray-600">
                      Day of the month the next month opens
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.releaseDayOfMonth}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          const clamped = Number.isNaN(parsed) ? 1 : Math.min(31, Math.max(1, parsed));
                          setFormData({ ...formData, releaseDayOfMonth: clamped });
                        }}
                        className="w-24 rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
                      />
                      <span className="text-sm text-gray-600">of every month</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      e.g. set to 25 and the current month stays fully bookable, with next month opening up
                      once the 25th arrives.
                    </p>
                  </div>
                )}

                {formData.availabilityReleasePolicy === 'fully_open' && (
                  <div className="mt-3 ml-8 flex items-start gap-2 rounded-xl bg-gray-50 border border-gray-200 p-3 animate-in slide-in-from-left-2 fade-in duration-200">
                    <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-600">
                      Every future date is bookable — the calendar just displays up to a year ahead so it
                      doesn&apos;t scroll forever.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <input
                  type="checkbox"
                  id="autoConfirm"
                  checked={formData.autoConfirmAppointments}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      autoConfirmAppointments: e.target.checked,
                    })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/20 cursor-pointer"
                />
                <label htmlFor="autoConfirm" className="text-sm text-gray-700 cursor-pointer flex-1">
                  Auto-confirm appointments
                </label>
                {formData.autoConfirmAppointments && (
                  <CheckCircle2 className="h-4 w-4 text-gray-700" />
                )}
              </div>
            </div>
          )}

          {/* Applies regardless of which section is being edited */}
          <div className="mt-6 p-3 rounded-xl bg-gray-100 border border-gray-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-gray-700 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-700">
              Changes to these settings will apply to all future appointments.
              Existing appointments won&apos;t be affected.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-6 py-5">
          <button
            type="button"
            onClick={() => onClose()}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
          >
            {isUpdating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
