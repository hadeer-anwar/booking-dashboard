import type { PaginationParams, PaginationMeta, RawPersonIdentity } from '@/src/types';

// ─── Raw API shapes ───────────────────────────────────────────────────────────
//
// The backend returns at least three different appointment shapes, depending on
// the endpoint:
//
//   1. List/detail (populated):
//      { id, date, start, end, status, clinic: {...}, service: {...},
//        provider: {...}, customer: {...} }
//
//   2. Create response (flat IDs):
//      { id, clinicId, serviceId, providerId, customerId,
//        date, start, end, status }
//
//   3. Confirm/complete/cancel response (Mongo-style):
//      { _id, clinicId, serviceId, providerId, customerId,
//        date, startMinutes, endMinutes, startAt, endAt, status, ... }
//
// `RawAppointment` is intentionally permissive so the normalizer in
// appointments.api.ts can handle all three without throwing.

export type RawAppointmentPerson = RawPersonIdentity;

export type RawAppointmentClinic = {
  id?: string;
  _id?: string;
  name?: string;
  address?: string;
};

export type RawAppointmentService = {
  id?: string;
  _id?: string;
  name?: string;
  duration?: number;
  price?: number;
};

export interface RawAppointment {
  id?: string;
  _id?: string;
  date?: string;
  start?: string;
  end?: string;
  startMinutes?: number;
  endMinutes?: number;
  startAt?: string;
  endAt?: string;
  status?: AppointmentStatus;
  notes?: string;

  // Either nested objects (populated) …
  clinic?: RawAppointmentClinic;
  service?: RawAppointmentService;
  provider?: RawAppointmentPerson;
  customer?: RawAppointmentPerson;

  // … or flat ID fields.
  clinicId?: string;
  serviceId?: string;
  providerId?: string;
  customerId?: string;

  servicePrice?: number;
}

export interface RawListResponse {
  data: RawAppointment[];
  meta?: PaginationMeta;
}

export interface RawSingleResponse {
  appointment: RawAppointment;
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'pending_assignment'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface AppointmentPerson {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

export interface AppointmentService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface AppointmentClinic {
  id: string;
  name?: string;
  address?: string;
}

export interface Appointment {
  id: string;
  date: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  notes?: string;
  clinic: AppointmentClinic;
  service: AppointmentService;
  /**
   * Absent while `status === 'pending_assignment'` — the clinic's
   * doctorSelectionPolicy is "staff_assign" and no provider has been
   * assigned yet. See `assignProvider`.
   */
  provider?: AppointmentPerson;
  customer: AppointmentPerson;
  servicePrice: number;
}

export interface GetAppointmentsParams extends PaginationParams {
  status?: AppointmentStatus;
  /** Filter appointments on or after this date (YYYY-MM-DD). */
  from?: string;
  /** Filter appointments on or before this date (YYYY-MM-DD). */
  to?: string;
}

// ─── Available slots ──────────────────────────────────────────────────────────

export interface SlotProvider {
  _id: string;
  name: string;
  email: string;
}

export interface AvailableSlot {
  date: string;
  startMinutes: number;
  endMinutes: number;
  start: string;
  end: string;
  /**
   * Only present when the clinic's doctorSelectionPolicy is "customer_choice".
   * For auto_assign / staff_assign clinics the backend intentionally omits
   * this — the provider is decided after booking — so callers must not
   * assume it's set.
   */
  provider?: SlotProvider;
}

export interface GetAvailableSlotsParams {
  date: string; // "YYYY-MM-DD"
}

// ─── Create appointment ───────────────────────────────────────────────────────

export interface CreateAppointmentPayload {
  serviceId: string;
  date: string;       // "YYYY-MM-DD"
  start: string;      // "HH:MM"
  /**
   * Only meaningful when the clinic's doctorSelectionPolicy is
   * "customer_choice" — pass the chosen slot's `provider._id`. Omit it for
   * auto_assign (server picks the best available provider) and staff_assign
   * (appointment is created as "pending_assignment" with no provider).
   */
  providerId?: string;
  notes?: string;
  phoneNumber?: string;
}

// ─── Cancel appointment ───────────────────────────────────────────────────────

export interface CancelAppointmentPayload {
  /** Required by the backend — explains why the appointment was cancelled. */
  cancellationReason: string;
}

// ─── Assign provider (staff_assign / pending_assignment flow) ────────────────

export interface AssignProviderPayload {
  providerId: string;
}

/** Raw shape of one entry in GET /appointments/:id/available-providers. */
export interface RawAvailableProvider extends Omit<RawPersonIdentity, 'id' | '_id' | 'fullName'> {
  id: string;
  specialty?: string;
  /** How the provider qualifies: an explicit service assignment or a global provider. */
  source: 'assigned' | 'global';
}

export interface RawAvailableProvidersResponse {
  appointment: { id: string; clinicId: string; serviceId: string };
  providers: RawAvailableProvider[];
}

/**
 * A provider eligible to be assigned to a specific pending_assignment
 * appointment — already filtered server-side for working hours, blocks, and
 * conflicting bookings at that exact slot. Advisory only: `assignProvider`
 * re-validates at write time since state can change between fetch and click.
 */
export interface AvailableAppointmentProvider {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  specialty?: string;
  source: 'assigned' | 'global';
}

// ─── Legacy helpers ───────────────────────────────────────────────────────────

export interface RawCustomerUser extends Omit<RawPersonIdentity, 'id' | '_id' | 'fullName'> {
  id: string;
}
