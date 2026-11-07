import { z } from 'zod';

export const providerSelectionPolicySchema = z.enum(['customer_choice', 'auto_assign', 'staff_assign']);

/**
 * How far ahead customers can see/book availability. Mirrors the backend's
 * `AVAILABILITY_RELEASE_POLICIES` (clinic-settings.model.ts) exactly —
 * these three string values are enforced server-side at booking time, not
 * just a display concern.
 *  - rolling_window: fixed N-day horizon that slides forward every day.
 *  - monthly_release: open through the end of the current month; the next
 *    month opens once `releaseDayOfMonth` is reached.
 *  - fully_open: no fixed horizon (backend caps the calendar display at 365
 *    days out, but nothing closes before then).
 */
export const availabilityReleasePolicySchema = z.enum(['rolling_window', 'monthly_release', 'fully_open']);

export const clinicSettingsSchema = z.object({
  id: z.string(),
  clinicId: z.string(),
  serviceBufferTime: z.number(),
  appointmentCancellationTimeHours: z.number().optional(),
  appointmentCancellationTimeDays: z.number().optional(),
  allowCancelAppointment: z.boolean(),
  allowRescheduleAppointment: z.boolean(),
  rescheduleAppointmentLimit: z.number(),
  maxAdvanceBookingDays: z.number(),
  autoConfirmAppointments: z.boolean(),
  // Property key kept as `doctorSelectionPolicy` to match the backend's wire
  // field name exactly (see clinic-settings.model.ts) — only the display
  // wording and local type/schema names use "provider" terminology.
  // Defaulted like the two release-policy fields below: older settings docs
  // predate this field, and the backend treats a missing policy as
  // 'customer_choice'.
  doctorSelectionPolicy: providerSelectionPolicySchema.default('customer_choice'),
  // Defaulted rather than required: older settings docs predate these two
  // fields, and the backend itself treats a missing policy as
  // 'rolling_window' (see release-window.ts's `resolvePolicy`) — defaulting
  // here keeps the frontend's fallback consistent with the backend's.
  availabilityReleasePolicy: availabilityReleasePolicySchema.default('rolling_window'),
  releaseDayOfMonth: z.number().int().min(1).max(31).default(1),
});

export type ClinicSettings = z.infer<typeof clinicSettingsSchema>;
export type ProviderSelectionPolicy = z.infer<typeof providerSelectionPolicySchema>;
export type AvailabilityReleasePolicy = z.infer<typeof availabilityReleasePolicySchema>;
