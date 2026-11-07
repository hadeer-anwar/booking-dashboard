import { api } from '@/src/lib/api/axios';
import type { ClinicSettings } from '../types/types';
import { clinicSettingsSchema } from '../schemas/settings.schema';

export const settingsApi = {
  fetchSettings: async (clinicId: string): Promise<ClinicSettings> => {
    const response = await api.get<{ settings: unknown }>(`/clinics/${clinicId}/settings`);
    const result = clinicSettingsSchema.safeParse(response.data.settings);
    if (!result.success) {
      throw new Error('Received malformed clinic settings from the server.');
    }
    return result.data;
  },

  updateSettings: async (clinicId: string, settings: ClinicSettings): Promise<ClinicSettings> => {
    // id/clinicId are server-assigned and immutable — strip them so the PUT
    // body only carries fields the caller can actually change.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, clinicId: _clinicId, appointmentCancellationTimeHours, appointmentCancellationTimeDays, ...rest } = settings;

    const sanitizedSettings = {
      ...rest,
      ...(appointmentCancellationTimeHours != null
        ? { appointmentCancellationTimeHours }
        : appointmentCancellationTimeDays != null
          ? { appointmentCancellationTimeDays }
          : {}),
    };

    const response = await api.put<{ settings: unknown }>(
      `/clinics/${clinicId}/settings`,
      sanitizedSettings
    );

    // The PUT already succeeded server-side by this point — a schema drift
    // in the echoed response shouldn't fail the mutation itself. Fall back
    // to the settings we just saved so the caller still gets usable data.
    const result = clinicSettingsSchema.safeParse(response.data.settings);
    return result.success ? result.data : settings;
  },
};
