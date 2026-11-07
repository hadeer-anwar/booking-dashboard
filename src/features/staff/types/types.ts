import type { ClinicSchedule, ScheduleWorkingDayPayload } from '@/src/features/schedule/types/types';
import type { PaginationParams, PaginationMeta, RawPersonIdentity } from '@/src/types';

/* ─── Raw API shapes ──────────────────────────────────────────────────────── */

/**
 * Raw person as actually returned by GET /clinics/:id/staff/:userId — `fullName`
 * and `isActive` are NOT guaranteed by the backend (the normalizer derives/
 * defaults them), and `schedule` is still in wire shape (`start`/`end` strings,
 * not the `startMinutes`/`endMinutes` convention used by write payloads).
 * See `ClinicStaffMember` for the normalized shape callers should use.
 */
export interface RawClinicStaffPerson
  extends Omit<RawPersonIdentity, 'id' | '_id' | 'email'> {
  id: string;
  email: string;
  country?: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  specialty?: string;
  schedule?: {
    workingDays: Array<{
      day: string;
      isOpen: boolean;
      hours: Array<{ start: string; end: string }>;
    }>;
  };
}

/**
 * Normalized clinic staff member — what `clinicStaffApi` actually returns.
 * Unlike `RawClinicStaffPerson`, `fullName` and `isActive` are always present
 * (derived/defaulted by `normalizeClinicStaffMember`) and `schedule` is a
 * proper `ClinicSchedule`, not the raw wire shape.
 */
export interface ClinicStaffMember
  extends Omit<RawPersonIdentity, 'id' | '_id' | 'email' | 'fullName'> {
  id: string;
  email: string;
  fullName: string;
  country?: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  specialty?: string;
  schedule?: ClinicSchedule;
}

export interface ClinicStaffListResponse {
  providers?: ClinicStaffMember[];
  clinicAdmin?: ClinicStaffMember[];
  moderators?: ClinicStaffMember[];
  meta?: PaginationMeta;
}

/* ─── Payload shapes (write operations) ──────────────────────────────────── */

export interface CreateClinicStaffPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
  phoneNumber: string;
  role: 'provider' | 'clinic_admin' | 'moderator' | string;
  specialty?: string;
}

/** PATCH /clinics/:clinicId/staff/:userId — update staff profile fields */
export interface UpdateClinicStaffPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  specialty?: string;
}

/** PATCH /clinics/:clinicId/staff/:userId/status */
export interface UpdateClinicStaffStatusPayload {
  isActive: boolean;
}

/** PATCH /clinics/:clinicId/staff/:providerId/schedule */
export interface UpdateClinicStaffSchedulePayload {
  schedule: {
    workingDays: ScheduleWorkingDayPayload[];
  };
}

/* ─── Misc / response shapes ──────────────────────────────────────────────── */

export interface ClinicStaffMembershipRaw {
  id: string;
  userId?: string;
  clinicId?: string;
  role?: string;
  isActive?: boolean;
  schedule?: RawClinicStaffPerson['schedule'];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateClinicStaffScheduleResponse {
  message?: string;
  membership?: ClinicStaffMembershipRaw;
}

export type GetClinicStaffParams = PaginationParams;

/* ─── Constants ───────────────────────────────────────────────────────────── */

export const ALL_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type DayName = (typeof ALL_DAYS)[number];


export type SlotDraft = { clientId: string; start: string; end: string };

/* ─── Service assignment shapes ───────────────────────────────────────────── */

export interface AssignmentProvider
  extends Omit<RawPersonIdentity, 'id' | '_id' | 'firstName' | 'lastName' | 'email' | 'fullName'> {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country?: string;
  role: string;
  isActive: boolean;
  schedule?: ClinicSchedule;
}

export interface ServiceAssignment {
  id: string;
  provider: AssignmentProvider;
  schedule: ClinicSchedule;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceAssignmentsResponse {
  data: ServiceAssignment[];
  meta?: PaginationMeta;
}

export interface DeactivateAssignmentResponse {
  message: string;
  assignment: {
    id: string;
    schedule: { workingDays: unknown[] };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

/** Standard list params for assignments — `page`, `limit`, `search`. */
export type GetServiceAssignmentsParams = PaginationParams;
