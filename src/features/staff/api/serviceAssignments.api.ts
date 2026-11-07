import { api } from '@/src/lib/api/axios';
import { buildListQuery, extractPaginationMeta } from '@/src/lib/api/pagination';
import type { PaginatedResult } from '@/src/types';
import type {
  ServiceAssignment,
  ServiceAssignmentsResponse,
  DeactivateAssignmentResponse,
  GetServiceAssignmentsParams,
} from '../types/types';

export const serviceAssignmentsApi = {
  /**
   * GET /clinics/:clinicId/services/:serviceId/assignments
   * Accepts `?page&limit&search`. Backend matches `search` against the
   * provider's first name, email, and the assignment's service name.
   */
  getServiceAssignments: async (
    clinicId: string,
    serviceId: string,
    params?: GetServiceAssignmentsParams
  ): Promise<PaginatedResult<ServiceAssignment>> => {
    const response = await api.get<ServiceAssignmentsResponse>(
      `/clinics/${clinicId}/services/${serviceId}/assignments`,
      { params: buildListQuery(params) }
    );
    const data = response.data?.data ?? [];
    const meta = extractPaginationMeta(response.data, {
      page: params?.page,
      limit: params?.limit,
      resultCount: data.length,
    });
    return { data, meta };
  },

  /**
   * GET /clinics/:clinicId/assignments
   * Clinic-wide assignments list with `?page&limit&search`.
   * Backend matches `search` against the assignment's service name and
   * the provider's first name / email.
   *
   * No list page consumes this yet — exported for future use so callers
   * stay consistent with the rest of the paginated APIs.
   */
  listClinicAssignments: async (
    clinicId: string,
    params?: GetServiceAssignmentsParams
  ): Promise<PaginatedResult<ServiceAssignment>> => {
    const response = await api.get<ServiceAssignmentsResponse>(
      `/clinics/${clinicId}/assignments`,
      { params: buildListQuery(params) }
    );
    const data = response.data?.data ?? [];
    const meta = extractPaginationMeta(response.data, {
      page: params?.page,
      limit: params?.limit,
      resultCount: data.length,
    });
    return { data, meta };
  },

  /**
   * POST /clinics/:clinicId/services/:serviceId/providers/:providerId
   * Assigns a clinic staff provider to a service.
   */
  assignProviderToService: async (
    clinicId: string,
    serviceId: string,
    providerId: string
  ): Promise<void> => {
    await api.post(
      `/clinics/${clinicId}/services/${serviceId}/providers/${providerId}`
    );
  },

  /**
   * PATCH /assignments/:assignmentId/status
   * Deactivates a service–provider assignment.
   * Body: { isActive: false }
   */
  deactivateAssignment: async (
    assignmentId: string
  ): Promise<DeactivateAssignmentResponse> => {
    const response = await api.patch<DeactivateAssignmentResponse>(
      `/assignments/${assignmentId}/status`,
      { isActive: false }
    );
    return response.data;
  },
};
