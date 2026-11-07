import { api } from '@/src/lib/api/axios';
import { appendImageFiles } from '@/src/lib/api/media';
import { buildListQuery, extractPaginationMeta } from '@/src/lib/api/pagination';
import type { PaginatedResult } from '@/src/types';
import {
  RawClinicDetailResponse,
  GetClinicsParams,
  GetClinicsListResponse,
  RawClinicDetail,
  CreateClinicPayload,
  UpdateClinicPayload,
} from '../types/types';
import type { Clinic } from '../types/types';
import { normalizeClinicDetail, normalizeClinicFromList } from './clinicNormalize';

export const clinicsApi = {
  /**
   * GET /clinics — paginated list with `?page&limit&search`.
   * `search` is a free-text query (backend matches on name + address).
   */
  getClinics: async (params?: GetClinicsParams): Promise<PaginatedResult<Clinic>> => {
    const response = await api.get<GetClinicsListResponse>('/clinics', {
      params: buildListQuery(params, {
        isActive: params?.isActive ?? true,
        categoryId: params?.categoryId,
      }),
    });
    const list = response.data?.data ?? [];
    const data = list.map(normalizeClinicFromList);
    const meta = extractPaginationMeta(response.data, {
      page: params?.page,
      limit: params?.limit,
      resultCount: data.length,
    });
    return { data, meta };
  },

  /** Fetch full clinic details. Normalizes backend response (e.g. staff.providers → staff.doctors). */
  getClinicById: async (id: string): Promise<Clinic> => {
    const response = await api.get<RawClinicDetailResponse>(`/clinics/${id}`);
    return normalizeClinicDetail(response.data.clinic as RawClinicDetail);
  },

  /** Create a new clinic. POST /clinics (JSON body) */
  createClinic: async (payload: CreateClinicPayload): Promise<Clinic> => {
    const response = await api.post<{ clinic: RawClinicDetail }>('/clinics', {
      name: payload.name,
      address: payload.address,
      about: payload.about,
      phone: payload.phone,
      type: payload.type,
      categoryIds: payload.categoryIds,
    });
    return normalizeClinicDetail(response.data.clinic);
  },

  /** Update an existing clinic. PATCH /clinics/:id (JSON body) */
  updateClinic: async (id: string, payload: UpdateClinicPayload): Promise<Clinic> => {
    const response = await api.patch<{ clinic: RawClinicDetail }>(`/clinics/${id}`, {
      name: payload.name,
      address: payload.address,
      about: payload.about,
      phone: payload.phone,
      type: payload.type,
      categoryIds: payload.categoryIds,
    });
    return normalizeClinicDetail(response.data.clinic);
  },

  /** Upload / replace clinic photos. PUT /clinics/:clinicId/images (multipart/form-data) */
  uploadClinicImages: async (clinicId: string, files: File[]): Promise<void> => {
    const fd = new FormData();
    appendImageFiles(fd, files);
    await api.put(`/clinics/${clinicId}/images`, fd);
  },
};
