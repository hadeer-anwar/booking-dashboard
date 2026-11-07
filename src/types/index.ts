export type { RawPersonIdentity } from './rawPerson';

export type UserRole = 'super_admin' | 'clinic_admin' | 'moderator' | 'doctor';

/**
 * Clinic-scoped management roles — moderator mirrors clinic_admin across
 * every clinic-management surface (staff, services, schedules, blocked
 * periods, appointments, settings-read) except two divergences enforced by
 * the backend: only moderator (not clinic_admin) can write clinic settings,
 * and only super_admin can create a moderator account. Mirrors the
 * backend's `CLINIC_ADMIN_ROLES` (src/shared/constants/roles.ts).
 */
export const CLINIC_ADMIN_ROLES: UserRole[] = ['clinic_admin', 'moderator'];

/** True for any role that manages a single clinic (clinic_admin or moderator). */
export function isClinicManagerRole(role: string | null | undefined): boolean {
  return role != null && CLINIC_ADMIN_ROLES.includes(role as UserRole);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  clinic_admin: 'Clinic Admin',
  moderator: 'Moderator',
  doctor: 'Doctor',
};

export interface User {
  id: string;
  email: string;

  firstName?: string;
  lastName?: string;
  /** Display name; may be returned by API or derived from firstName/lastName */
  fullName?: string;
  phoneNumber?: string;
  country?: string;
  isActive?: boolean;
  role: UserRole;
  /** The clinic this user manages (clinic_admin role). May come as clinicId or inside clinicIds[]. */
  clinicId?: string;
}

/** Standard pagination metadata returned by every paginated list endpoint. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Standard shape returned by a paginated list endpoint after normalization. */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Standard query params accepted by every paginated list endpoint. */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

/** Sensible defaults used when meta is missing. */
export const EMPTY_PAGINATION_META: PaginationMeta = {
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 1,
};

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}



