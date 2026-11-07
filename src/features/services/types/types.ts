import type { PaginationParams, PaginationMeta } from '@/src/types';

export interface Service {
  id: string;
  name: string;
  clinicId: string;
  categoryId: string;
  duration: number;
  price?: number;
  isActive: boolean;
  isOpenAllTime?: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;

  images?: string[];
  /** Present on some list/detail responses; used for staff display on service rows */
  providersCount: number;
}

/** GET /services — list response (paginated) */
export interface ServicesListResponse {
  data?: Service[];
  meta?: PaginationMeta;
}

/** GET /clinics/:clinicId/services — may use `services` or `data` */
export interface ClinicServicesResponse {
  data?: unknown[];
}

export interface GetServicesParams extends PaginationParams {
  clinicId?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface GetClinicServicesParams extends PaginationParams {
  isActive?: boolean;
}

export interface CreateServicePayload {
  name: string;
  description?: string;
  clinicId: string;
  categoryId: string;
  duration: number;
  price: number;
  isOpenAllTime?: boolean;
  isActive?: boolean;
}

export interface UpdateServicePayload {
  name?: string;
  categoryId?: string;
  duration?: number;
  price?: number;
}
