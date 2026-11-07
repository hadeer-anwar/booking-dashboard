import { api } from '@/src/lib/api/axios';
import { buildListQuery, extractPaginationMeta } from '@/src/lib/api/pagination';
import type { ClinicSchedule } from '@/src/features/schedule/types/types';
import { ClinicStaffListResponse, ClinicStaffMember, CreateClinicStaffPayload, GetClinicStaffParams, RawClinicStaffPerson, UpdateClinicStaffPayload, UpdateClinicStaffSchedulePayload, UpdateClinicStaffScheduleResponse, UpdateClinicStaffStatusPayload } from '../types/types';



function normalizeSchedule(
  raw?: RawClinicStaffPerson['schedule']
): ClinicSchedule | undefined {
  if (!raw?.workingDays) return undefined;
  return {
    workingDays: raw.workingDays.map((wd) => ({
      day: wd.day,
      isOpen: wd.isOpen,
      hours: (wd.hours ?? []).map((h) => ({
        start: h.start ?? '00:00',
        end: h.end ?? '00:00',
      })),
    })),
  };
}



function normalizeClinicStaffMember(raw: RawClinicStaffPerson): ClinicStaffMember {
  const fullName =
    [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim() || raw.email;
  return {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.email,
    fullName: fullName,
    phoneNumber: raw.phoneNumber,
    country: raw.country,
    role: raw.role,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    specialty: raw.specialty,
    schedule: normalizeSchedule(raw.schedule),
  };
}





export const clinicStaffApi = {
  /** GET /clinics/:clinicId/staff?page&limit&search */
  getClinicStaff: async (
    clinicId: string,
    params?: GetClinicStaffParams
  ): Promise<ClinicStaffListResponse> => {
    const response = await api.get<{ data: ClinicStaffListResponse }>(
      `/clinics/${clinicId}/staff`,
      { params: buildListQuery(params) }
    );
    const d = response.data;
    const providers = (d?.data?.providers as RawClinicStaffPerson[] ?? []).map(normalizeClinicStaffMember);
    const clinicAdmin = (d?.data?.clinicAdmin as RawClinicStaffPerson[] ?? []).map(normalizeClinicStaffMember);
    const moderators = (d?.data?.moderators as RawClinicStaffPerson[] ?? []).map(normalizeClinicStaffMember);
    const meta = extractPaginationMeta(d?.data, {
      page: params?.page,
      limit: params?.limit,
      resultCount: providers.length + clinicAdmin.length + moderators.length,
    });
    return { providers, clinicAdmin, moderators, meta };
  },

  getClinicStaffById: async (
    clinicId: string,
    userId: string
  ): Promise<ClinicStaffMember> => {
    const response = await api.get(`/clinics/${clinicId}/staff/${userId}`);

    return normalizeClinicStaffMember(response.data.data as RawClinicStaffPerson);
  },

  /** POST /clinics/:clinicId/staff */
  createClinicStaff: async (
    clinicId: string,
    payload: CreateClinicStaffPayload
  ): Promise<void> => {
    await api.post(`/clinics/${clinicId}/staff`, payload);
  },

  /** PATCH /clinics/:clinicId/staff/:userId — update staff member info */
  updateClinicStaff: async (
    clinicId: string,
    userId: string,
    payload: UpdateClinicStaffPayload
  ): Promise<void> => {
    await api.patch(`/clinics/${clinicId}/staff/${userId}`, payload);
  },

  /** GET /clinics/:clinicId/staff/:providerId/schedule */
  getProviderSchedule: async (
    clinicId: string,
    providerId: string
  ): Promise<ClinicSchedule> => {
    const response = await api.get<
      | { schedule: ClinicSchedule }
      | { data: { schedule: ClinicSchedule } }
    >(`/clinics/${clinicId}/staff/${providerId}/schedule`);
    const body = response.data as Record<string, unknown>;
    const schedule =
      (body?.schedule as ClinicSchedule) ??
      (body?.data as { schedule?: ClinicSchedule } | undefined)?.schedule;
    if (!schedule?.workingDays) {
      return { workingDays: [] };
    }
    return {
      workingDays: schedule.workingDays.map((wd) => ({
        day: wd.day,
        isOpen: wd.isOpen,
        hours: (wd.hours ?? []).map((h) => ({
          start: typeof h === 'object' && h && 'start' in h ? String(h.start) : '00:00',
          end: typeof h === 'object' && h && 'end' in h ? String(h.end) : '00:00',
        })),
      })),
    };
  },

  /** PATCH /clinics/:clinicId/staff/:userId/status — body `{ isActive }` */
  updateStaffStatus: async (
    clinicId: string,
    userId: string,
    payload: UpdateClinicStaffStatusPayload
  ): Promise<void> => {
     await api.patch(`/clinics/${clinicId}/staff/${userId}/status`, payload);
     
  },

  /** PATCH /clinics/:clinicId/staff/:providerId/schedule */
  updateStaffSchedule: async (
    clinicId: string,
    providerId: string,
    payload: UpdateClinicStaffSchedulePayload
  ): Promise<UpdateClinicStaffScheduleResponse> => {
    const response = await api.patch<UpdateClinicStaffScheduleResponse>(
      `/clinics/${clinicId}/staff/${providerId}/schedule`,
      payload
    );
    return response.data ?? {};
  },
};
