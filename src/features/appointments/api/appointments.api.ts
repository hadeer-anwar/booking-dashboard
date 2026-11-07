import { api } from '../../../lib/api/axios';
import { buildListQuery, extractPaginationMeta } from '@/src/lib/api/pagination';
import type { PaginatedResult } from '@/src/types';
import type {
  RawListResponse,
  RawSingleResponse,
  Appointment,
  GetAppointmentsParams,
  AvailableSlot,
  GetAvailableSlotsParams,
  CreateAppointmentPayload,
  CancelAppointmentPayload,
  AssignProviderPayload,
  RawAvailableProvidersResponse,
  AvailableAppointmentProvider,
  RawCustomerUser,
} from '../types/types';
import { normalizeAppointment, normalizeAvailableProvider } from './appointmentNormalize';

// ─── API ──────────────────────────────────────────────────────────────────────

export const appointmentsApi = {
  /** GET /clinics/:clinicId/appointments — paginated, accepts ?page&limit&search */
  getClinicAppointments: async (
    clinicId: string,
    params?: GetAppointmentsParams
  ): Promise<PaginatedResult<Appointment>> => {
    const response = await api.get<RawListResponse>(
      `/clinics/${clinicId}/appointments`,
      {
        params: buildListQuery(params, {
            status: params?.status,
            from: params?.from,
            to: params?.to,
          }),
      }
    );
    const list = response.data?.data ?? [];
    const data = list.map(normalizeAppointment);
    const meta = extractPaginationMeta(response.data, {
      page: params?.page,
      limit: params?.limit,
      resultCount: data.length,
    });
    return { data, meta };
  },

  /** GET /appointments/:id */
  getAppointmentById: async (id: string): Promise<Appointment> => {
    const response = await api.get<RawSingleResponse>(`/appointments/${id}`);
    return normalizeAppointment(response.data.appointment);
  },

  /**
   * GET /clinics/:clinicId/services/:serviceId/available-slots?date=YYYY-MM-DD
   * Returns all available time slots for a given service on a specific date.
   */
  getAvailableSlots: async (
    clinicId: string,
    serviceId: string,
    params: GetAvailableSlotsParams
  ): Promise<AvailableSlot[]> => {
    const response = await api.get<{ slots: AvailableSlot[] }>(
      `/clinics/${clinicId}/services/${serviceId}/available-slots`,
      { params }
    );
    return response.data?.slots ?? [];
  },

  /** POST /clinics/:clinicId/appointments */
  createAppointment: async (
    clinicId: string,
    payload: CreateAppointmentPayload
  ): Promise<Appointment> => {
    const response = await api.post<RawSingleResponse>(
      `/clinics/${clinicId}/appointments`,
      payload
    );
    return normalizeAppointment(response.data.appointment);
  },

  /** PATCH /appointments/:id/confirm */
  confirmAppointment: async (id: string): Promise<Appointment> => {
    const response = await api.patch<RawSingleResponse>(
      `/appointments/${id}/confirm`
    );
    return normalizeAppointment(response.data.appointment);
  },

  /** PATCH /appointments/:id/complete */
  completeAppointment: async (id: string): Promise<Appointment> => {
    const response = await api.patch<RawSingleResponse>(
      `/appointments/${id}/complete`
    );
    return normalizeAppointment(response.data.appointment);
  },

  /**
   * PATCH /appointments/:id/cancel
   * The backend requires `cancellationReason` in the request body.
   */
  cancelAppointment: async (
    id: string,
    payload: CancelAppointmentPayload
  ): Promise<Appointment> => {
    const response = await api.patch<RawSingleResponse>(
      `/appointments/${id}/cancel`,
      payload
    );
    return normalizeAppointment(response.data.appointment);
  },


  assignProvider: async (
    id: string,
    payload: AssignProviderPayload
  ): Promise<Appointment> => {
    const response = await api.patch<RawSingleResponse>(
      `/appointments/${id}/assign`,
      payload
    );
    return normalizeAppointment(response.data.appointment);
  },


  getAvailableProviders: async (id: string): Promise<AvailableAppointmentProvider[]> => {
    const response = await api.get<RawAvailableProvidersResponse>(
      `/appointments/${id}/available-providers`
    );
    return (response.data?.providers ?? []).map(normalizeAvailableProvider);
  },

  /** GET /users?role=customer */
  getCustomers: async (search?: string): Promise<RawCustomerUser[]> => {
    const response = await api.get<{ data: RawCustomerUser[] }>('/users', {
      params: { role: 'customer', search: search || undefined },
    });
    return response.data?.data ?? [];
  },
};