import { User, PaginationParams, PaginationMeta, RawPersonIdentity } from '@/src/types';
import { Service } from '../../services/types/types';
import type { ClinicSchedule } from '@/src/features/schedule/types/types';

export type {
  ClinicSchedule,
  ClinicScheduleHour,
  ClinicWorkingDay,
  ScheduleWorkingDayPayload,
  UpdateSchedulePartialPayload,
} from '@/src/features/schedule/types/types';

export interface GetClinicsParams extends PaginationParams {
  isActive?: boolean;
  categoryId?: string;
}

/** Raw clinic item from GET /clinics (response.data.data[]) */
export interface RawClinicFromList {
  id: string;
  name: string;
  address: string;
  about?: string;
  phone?: string;
  /** Clinic type (e.g. specialty); free-form string from API */
  type?: string;
  isActive?: boolean;
  schedule?: {
    workingDays: Array<{
      day: string;
      isOpen: boolean;
      hours: Array<{ start: string; end: string }>;
    }>;
  };
  categories?: string[];
  /** Explicit counts from API (camelCase or snake_case) */
  servicesCount?: number;
  services_count?: number;
  providersCount?: number;
  providers_count?: number;
  doctorsCount?: number;
  /** If list embeds arrays, length is used when counts are omitted */
  services?: unknown[];
  staff?: {
    providers?: unknown[];
    clinicAdmin?: unknown[];
  };
  _count?: {
    services?: number;
    providers?: number;
  };
  images?: unknown;
}

/** GET /clinics response shape */
export interface GetClinicsListResponse {
  data: RawClinicFromList[];
  meta?: PaginationMeta;
}

/** Backend GET /clinics/:id response — property names as returned by API */
export interface RawClinicDetailResponse {
  clinic: RawClinicDetail;
}

export interface RawClinicDetail {
  id: string;
  name: string;
  address: string;
  about?: string;
  phone?: string;
  /** Clinic type (e.g. specialty); free-form string from API */
  type?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Count fields that may be returned by the API */
  servicesCount?: number;
  services_count?: number;
  providersCount?: number;
  providers_count?: number;
  clinicAdminsCount?: number;
  clinic_admins_count?: number;
  _count?: {
    services?: number;
    providers?: number;
    clinicAdmins?: number;
  };
  schedule?: {
    workingDays: Array<{
      day: string;
      isOpen: boolean;
      hours: Array<{ start: string; end: string }>;
    }>;
  };
  categories?: Array<{ id: string; name: string; description?: string }>;
  staff?: {
    providers?: RawStaffUser[];
    clinicAdmin?: RawStaffUser[];
  };
  services?: unknown[];
  images?: unknown;
}

/** Staff user as returned by backend (may use fullName or firstName/lastName) */
export interface RawStaffUser extends Omit<RawPersonIdentity, 'id' | '_id' | 'email'> {
  id: string;
  email: string;
  isActive?: boolean;
  role: string;
  clinicIds?: string[];
  [key: string]: unknown;
}

export interface CreateClinicPayload {
  name: string;
  address: string;
  about?: string;
  phone?: string;
  /** Clinic type label (free-form string). */
  type?: string;
  categoryIds?: string[];
}

export interface UpdateClinicPayload {
  name?: string;
  address?: string;
  about?: string;
  phone?: string;
  type?: string;
  categoryIds?: string[];
}

export interface ClinicStaffUser extends User {
  isActive: boolean;
  clinicIds: string[];
}

export interface ClinicStaff {
  doctors: ClinicStaffUser[];
  clinicAdmin: ClinicStaffUser[];
}

export interface ClinicCategory {
  id: string;
  name: string;
  description: string;
  images?: string[];
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  isActive?: boolean;
  /** Clinic type (free-form string). */
  type?: string;
  about?: string;
  images?: string[];
  services?: Service[];
  categories?: ClinicCategory[];
  schedule?: ClinicSchedule;
  createdAt?: string;
  updatedAt?: string;
  staff?: ClinicStaff;
  phone?: string;
  workingHours?: string;
  specialties?: string[];
  doctorsCount?: number;
  providersCount?: number;
  servicesCount?: number;
  clinicAdminsCount?: number;
}
