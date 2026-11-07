// features/dashboard/hooks/useClinicDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/api";
import { DashboardData } from "../types/types";

interface UseClinicDashboardProps {
  clinicId: string;
  from?: Date | null;
  to?: Date | null;
}

export const useClinicDashboard = ({ clinicId, from, to }: UseClinicDashboardProps) => {
  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['clinicDashboard', clinicId, from?.toISOString(), to?.toISOString()],
    queryFn: () => dashboardApi.getClinicAdminDashboardData(
      clinicId,
      from?.toISOString(),
      to?.toISOString()
    ),
    enabled: !!clinicId,
  });
  
  return { data, isLoading, error, refetch };
};