import { api } from '@/src/lib/api/axios';
import { appendImageFiles } from '@/src/lib/api/media';
import { buildListQuery, extractPaginationMeta } from '@/src/lib/api/pagination';
import type { PaginatedResult } from '@/src/types';
import type {
  Service,
  ServicesListResponse,
  ClinicServicesResponse,
  GetServicesParams,
  GetClinicServicesParams,
  CreateServicePayload,
  UpdateServicePayload,
} from '../types/types';
import { normalizeService } from './serviceNormalize';

export const servicesApi = {
  /** GET /clinics/:clinicId/services — fetch services for a clinic (paginated) */
  getClinicServices: async (
    clinicId: string,
    params?: GetClinicServicesParams
  ): Promise<PaginatedResult<Service>> => {
    const response = await api.get<ClinicServicesResponse>(
      `/clinics/${clinicId}/services`,
      { params: buildListQuery(params, { isActive: params?.isActive }) }
    );
    const body = response.data;
    const list = body?.data ?? [];
    const data = Array.isArray(list) ? list.map(normalizeService) : [];
    const meta = extractPaginationMeta(body, {
      page: params?.page,
      limit: params?.limit,
      resultCount: data.length,
    });
    return { data, meta };
  },

  getServices: async (
    params?: GetServicesParams
  ): Promise<PaginatedResult<Service>> => {
    const response = await api.get<ServicesListResponse>('/services', {
      params: buildListQuery(params, {
        clinic_id: params?.clinicId,
        category_id: params?.categoryId,
        is_active: params?.isActive,
      }),
    });
    const body = response.data;
    const list = body?.data ?? [];
    const data = Array.isArray(list) ? list.map(normalizeService) : [];
    const meta = extractPaginationMeta(body, {
      page: params?.page,
      limit: params?.limit,
      resultCount: data.length,
    });
    return { data, meta };
  },

  createService: async (payload: CreateServicePayload): Promise<Service> => {
    const response = await api.post<{ service: unknown } | unknown>('/services', {
      name: payload.name,
      describtion: payload.description ?? '',
      clinicId: payload.clinicId,
      categoryId: payload.categoryId,
      duration: payload.duration,
      price: payload.price,
      isOpenAllTime: payload.isOpenAllTime ?? false,
      isActive: payload.isActive,
    });
    const data = response.data as Record<string, unknown>;
    const raw = 'service' in data && data.service ? data.service : data;
    return normalizeService(raw);
  },

  updateService: async (id: string, payload: UpdateServicePayload): Promise<Service> => {
    const response = await api.patch<{ service: unknown } | unknown>(`/services/${id}`, {
      name: payload.name,
      categoryId: payload.categoryId,
      duration: payload.duration,
      price: payload.price,
    });
    const data = response.data as Record<string, unknown>;
    const raw = 'service' in data && data.service ? data.service : data;
    return normalizeService(raw);
  },

  /** Upload / replace service photos. PUT /services/:serviceId/images (multipart/form-data) */
  uploadServiceImages: async (serviceId: string, files: File[]): Promise<void> => {
    const fd = new FormData();
    appendImageFiles(fd, files);
    await api.put(`/services/${serviceId}/images`, fd);
  },

  updateServiceStatus: async (serviceId: string, isActive: boolean): Promise<Service> => {
    const response = await api.patch<{ service: unknown } | unknown>(
      `/services/${serviceId}/status`,
      { isActive }
    );
    const data = response.data as Record<string, unknown>;
    const raw = 'service' in data && data.service ? data.service : data;
    return normalizeService(raw);
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};
