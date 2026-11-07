import { api } from '@/src/lib/api/axios';
import { normalizeClinicDetail } from '@/src/features/clinics/api/clinicNormalize';
import { clinicsApi } from '@/src/features/clinics/api/clinics.api';
import type { RawClinicDetail } from '@/src/features/clinics/types/types';
import type {
  ClinicSchedule,
  ScheduleWorkingDayPayload,
  UpdateSchedulePartialPayload,
} from '../types/types';
import type { Clinic } from '@/src/features/clinics/types/types';

export const scheduleApi = {
  /** PATCH /clinics/:id/schedule — replace schedule for one or more specific days. */
  updateClinicSchedulePartial: async (
    clinicId: string,
    payload: UpdateSchedulePartialPayload
  ): Promise<Clinic> => {
    const response = await api.patch<unknown>(`/clinics/${clinicId}/schedule`, payload);
    const body = response.data as Record<string, unknown>;

    const rawClinic =
      (body?.clinic as RawClinicDetail | undefined) ??
      (body?.data as { clinic?: RawClinicDetail } | undefined)?.clinic;

    if (rawClinic) {
      return normalizeClinicDetail(rawClinic);
    }

    const nestedSchedule =
      (body?.schedule as ClinicSchedule | undefined) ??
      (body?.data as { schedule?: ClinicSchedule } | undefined)?.schedule;

    if (nestedSchedule && Array.isArray(nestedSchedule.workingDays)) {
      const full = await clinicsApi.getClinicById(clinicId);
      return { ...full, schedule: nestedSchedule };
    }

    return clinicsApi.getClinicById(clinicId);
  },

  addClinicSchedule: async (
    clinicId: string,
    payload: { workingDays: ScheduleWorkingDayPayload[] }
  ): Promise<Clinic> => {
    return scheduleApi.updateClinicSchedulePartial(clinicId, payload);
  },
};
