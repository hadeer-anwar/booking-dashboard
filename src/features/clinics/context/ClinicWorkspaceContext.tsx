'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { PaginationMeta } from '@/src/components/ui/Pagination';
import type { Service } from '@/src/features/services/types/types';
import type { ClinicStaffMember } from '@/src/features/staff/types/types';

export interface ClinicWorkspaceContextValue {
  clinicId: string;
  clinicName?: string;
  staffDetailBasePath: string;
  staffProviders: ClinicStaffMember[];
  staffAdmins: ClinicStaffMember[];
  staffModerators: ClinicStaffMember[];
  staffSearch: string;
  setStaffSearch: (value: string) => void;
  staffMeta?: PaginationMeta;
  setStaffPage?: (page: number) => void;
  isStaffFetching?: boolean;
  refetchStaff: () => void | Promise<unknown>;
  services: Service[];
  categories: { id: string; name: string }[];
  servicesMeta?: PaginationMeta;
  setServicesPage?: (page: number) => void;
  isServicesFetching?: boolean;
  servicesSearch: string;
  setServicesSearch: (value: string) => void;
  servicesIsActive: boolean | undefined;
  setServicesIsActive: (value: boolean | undefined) => void;
  refetchClinic: () => void | Promise<unknown>;
}

const ClinicWorkspaceContext = createContext<ClinicWorkspaceContextValue | null>(null);

export function ClinicWorkspaceProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ClinicWorkspaceContextValue;
}) {
  return <ClinicWorkspaceContext.Provider value={value}>{children}</ClinicWorkspaceContext.Provider>;
}

export function useClinicWorkspace(): ClinicWorkspaceContextValue {
  const ctx = useContext(ClinicWorkspaceContext);
  if (!ctx) {
    throw new Error('useClinicWorkspace must be used within ClinicWorkspaceProvider');
  }
  return ctx;
}
