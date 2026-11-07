// features/dashboard/hooks/useSuperDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/api";
import { SuperAdminData } from "../types/types";

interface UseSuperDashboardProps {
  from?: Date | null;
  to?: Date | null;
}

export const useSuperDashboard = ({ from, to }: UseSuperDashboardProps = {}) => {
  const { data, isLoading, error, refetch } = useQuery<SuperAdminData>({
    queryKey: ['superDashboard', from?.toISOString(), to?.toISOString()],
    queryFn: () => dashboardApi.getSuperAdminDashboardData(
      from?.toISOString(),
      to?.toISOString()
    ),
  });
  
  return { data, isLoading, error, refetch };
};