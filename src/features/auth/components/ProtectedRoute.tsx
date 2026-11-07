'use client';

import { type ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { isClinicManagerRole } from '@/src/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const CLINIC_MANAGER_ONLY_PREFIXES = ['/dashboard/my-clinic'];

/** `/dashboard/clinics/:id` → id, or null for list route `/dashboard/clinics`. */
function clinicIdFromClinicsRoute(pathname: string): string | null {
  if (pathname === '/dashboard/clinics') return null;
  if (!pathname.startsWith('/dashboard/clinics/')) return null;
  const rest = pathname.slice('/dashboard/clinics/'.length);
  const id = rest.split('/')[0];
  return id ? id : null;
}

/** Where ProtectedRoute wants to redirect the current user, or null if they're allowed to stay. */
function resolveRedirect(
  user: { role: string; clinicId?: string | null } | null | undefined,
  pathname: string
): string | null {
  if (!user) return null;

  // Moderator is a clinic-scoped role identical to clinic_admin for routing
  // purposes — both are pinned to their own clinic and locked out of the
  // super-admin clinics list.
  const isClinicManager = isClinicManagerRole(user.role);
  const isSuperAdmin = user.role === 'super_admin';

  if (isClinicManager && pathname.startsWith('/dashboard/clinics')) {
    const detailId = clinicIdFromClinicsRoute(pathname);
    const allowedId = user.clinicId;
    const blocked = detailId === null || !allowedId || detailId !== allowedId;
    if (blocked) return '/dashboard/my-clinic';
  }

  if (isSuperAdmin && CLINIC_MANAGER_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    return '/dashboard';
  }

  return null;
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, hasHydrated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const roleDenied = Boolean(allowedRoles && user && !allowedRoles.includes(user.role));
  // Before the store has rehydrated, `user` is always null, so resolveRedirect
  // would incorrectly conclude "nothing to redirect" for a role that hasn't
  // loaded yet — hold off computing this until we actually know who's signed in.
  const redirectTo = hasHydrated && !roleDenied ? resolveRedirect(user, pathname) : null;

  // Navigation must happen after render, not while ProtectedRoute itself is rendering —
  // router.replace() updates state owned by the Router component.
  useEffect(() => {
    if (hasHydrated && redirectTo) router.replace(redirectTo);
  }, [hasHydrated, redirectTo, router]);

  // Middleware already guarantees an authenticated session by the time this
  // mounts; this loader only covers the brief window before the Zustand auth
  // store finishes reading `user`/`role` from localStorage. Without it, a
  // role-restricted route could flash its real content before the redirect
  // above has a chance to fire.
  if (!hasHydrated) {
    return <LoadingState fullScreen />;
  }

  if (roleDenied || redirectTo) {
    return null;
  }

  return <>{children}</>;
};