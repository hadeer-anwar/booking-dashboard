// features/dashboard/api/api.ts
import { api } from '@/src/lib/api/axios';
import { dashboardDataSchema, superAdminDataSchema } from '../schemas/dashboard.schema';

export const dashboardApi = {
  getClinicAdminDashboardData: async (clinicId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await api.get<{ data: unknown }>(
      `/clinics/${clinicId}/analytics/dashboard?${params.toString()}`
    );
    return dashboardDataSchema.parse(response.data.data);
  },

  getSuperAdminDashboardData: async (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await api.get<{ data: unknown }>(
      `/admin/analytics/dashboard?${params.toString()}`
    );
    return superAdminDataSchema.parse(response.data.data);
  },
};