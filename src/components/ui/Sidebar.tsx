'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { UserDropdown } from '@/src/features/auth/components/dropdown/UserDropdown';
import { useClinic } from '@/src/features/clinics/hooks/useClinic';
import { isClinicManagerRole, ROLE_LABELS } from '@/src/types';
import {
  LayoutGrid,
  Tags,
  Building2,
  Briefcase,
  CalendarDays,
  CalendarX2,
  Clock3,
  Users,
  Settings,
  X,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
  exact?: boolean;
}

const superAdminNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { label: 'Categories', href: '/dashboard/categories', icon: Tags },
  { label: 'Clinics', href: '/dashboard/clinics', icon: Building2 },
];

// Shared by clinic_admin and moderator — identical clinic-management surface
// for both roles (moderator additionally gets settings write access, gated
// inside the Settings page itself rather than by hiding the nav item).
const clinicManagerNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { label: 'Overview', href: '/dashboard/my-clinic', icon: Building2, exact: true },
  { label: 'Categories', href: '/dashboard/categories', icon: Tags },
  { label: 'Services', href: '/dashboard/my-clinic/services', icon: Briefcase },
  { label: 'Staff', href: '/dashboard/my-clinic/staff', icon: Users },
  { label: 'Schedule', href: '/dashboard/my-clinic/schedule', icon: Clock3 },
  { label: 'Blocked Periods', href: '/dashboard/my-clinic/blocked-periods', icon: CalendarX2 },
  { label: 'Appointments', href: '/dashboard/my-clinic/appointments', icon: CalendarDays },
  { label: 'Settings', href: '/dashboard/my-clinic/settings', icon: Settings },
];

interface SidebarProps {
  /** Mobile/tablet drawer open state — irrelevant at `lg` and up, where the sidebar is always visible. */
  /** true at ≥1200px (real viewport width, from DashboardShell's matchMedia check) — sidebar is permanently docked; false renders it as a drawer. */
  isDesktop: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Desktop (`isDesktop`, ≥1200px): always the full icon+label sidebar,
 * permanently docked — no icon-only collapse mode. Below that: an
 * off-canvas drawer, translated fully off-screen by default and slid in
 * over the page when `mobileOpen` is true (DashboardShell owns that state
 * and the backdrop). `isDesktop` is a real runtime check (matchMedia), not
 * a Tailwind responsive-prefix class — 1200px isn't one of Tailwind's stock
 * breakpoints, and driving this from JS removes any dependency on a custom
 * screen size having been picked up by the CSS build.
 */
export function Sidebar({ isDesktop, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, hasHydrated } = useAuthStore();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isClinicManager = isClinicManagerRole(user?.role);
  const navItems = isClinicManager ? clinicManagerNav : superAdminNav;

  // Names the clinic in the workspace card below. Shares `clinicKeys.detail`
  // with the my-clinic pages that already fetch it, so React Query serves it
  // from cache rather than issuing a second request; `enabled: !!clinicId`
  // means super admins (who have no clinicId) never fetch at all.
  const { clinic } = useClinic(isClinicManager ? user?.clinicId : undefined);
  const workspaceLabel = clinic?.name ?? (user?.role ? ROLE_LABELS[user.role] : '');
  const ADDRESS_MAX_LENGTH = 25;
  const workspaceAddress =
    clinic?.address && clinic.address.length > ADDRESS_MAX_LENGTH
      ? `${clinic.address.slice(0, ADDRESS_MAX_LENGTH)}...`
      : clinic?.address;
  const workspaceInitials =
    workspaceLabel
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]!.toUpperCase())
      .join('') || '—';

  // Focus the drawer's close button when it opens, and let Escape dismiss it
  // — the drawer acts as a modal overlay below the desktop breakpoint, so it
  // gets the same keyboard/focus courtesies a dialog would.
  useEffect(() => {
    if (!mobileOpen || isDesktop) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, isDesktop, onCloseMobile]);

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-white px-4 pb-5 pt-6 transition-transform duration-300 ease-in-out xl:w-[19rem] 2xl:w-80 ${
        isDesktop ? 'sticky top-0 z-auto translate-x-0' : mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      {/* Brand */}
      <div className="flex shrink-0 items-center justify-between px-2">
        <Link href="/dashboard" className="flex items-center">
          {/* Raw <img>: a fixed-size local wordmark with no responsive srcset
              to gain from next/image, and the same convention already used
              for media elsewhere in this codebase. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/bookedby-lola.webp"
            alt="booked by lola"
            className="h-10 w-auto max-w-[156px] object-contain object-left"
          />
        </Link>
        {/* Drawer close button — only rendered below the desktop breakpoint, where the sidebar is an overlay. */}
        {!isDesktop && (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="-mr-1.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Workspace card — which clinic you're managing, and as what. Mirrors
          the reference sidebar's gold-tinted identity card. Falls back to just
          the role label until the clinic name resolves, so it never renders a
          placeholder or an empty row. */}
      {isClinicManager && user?.role && (
        <div className="mt-8 shrink-0 rounded-2xl bg-gold-400/45 p-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white font-heading text-lg text-gray-900">
              {workspaceInitials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {clinic?.name ?? ROLE_LABELS[user.role]}
              </p>
              {workspaceAddress ? (
                <p className="truncate text-xs text-gray-700" title={clinic?.address}>
                  {workspaceAddress}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-7 flex-1 space-y-1.5 overflow-y-auto">
        {!hasHydrated ? (
          <div className="space-y-1.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (
          navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard' || item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                style={{ '--stagger-index': idx } as React.CSSProperties}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors animate-fade-in-up ${
                  isActive
                    ? 'bg-brand-400 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {/* No colour class of its own — the icon inherits the row's
                    `currentColor`, so it tracks the active/hover text colour
                    automatically instead of needing a parallel set of states. */}
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-gray-900/15 text-gray-900'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </nav>

      <div className="mt-auto shrink-0 border-t border-gray-200 pt-5">
        <UserDropdown menuPlacement="top" />
      </div>
    </aside>
  );
}
