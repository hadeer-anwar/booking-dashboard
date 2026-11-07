import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/src/features/auth/components/ProtectedRoute';
import { DashboardShell } from '@/src/components/ui/DashboardShell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
