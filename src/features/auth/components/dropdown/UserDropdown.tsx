'use client';

import { useEffect, useRef, useState } from 'react';
import { User, LogOut, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { useLogout } from '@/src/features/auth/hooks/useLogout';
import { useRouter } from 'next/navigation';
import { ROLE_LABELS } from '@/src/types';

interface UserDropdownProps {
  menuPlacement?: 'bottom' | 'right' | 'top';
}

export function UserDropdown({ menuPlacement = 'bottom' }: UserDropdownProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { logoutAsync, isPending: loggingOut } = useLogout();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const displayName =
    [user?.firstName?.trim(), user?.lastName?.trim()].filter(Boolean).join(' ') ||  
    user?.email ||
    'User';

  const initials =
    user?.firstName && user?.lastName
      ? `${(user.firstName[0] ?? '')}${(user.lastName[0] ?? '')}`.toUpperCase() 
        : user?.email
          ? user.email.slice(0, 2).toUpperCase()
          : '?';

  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'User';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Auth rehydrates from localStorage asynchronously — before that finishes,
  // `user` is null, so show a neutral skeleton instead of the "User"/"?"
  // placeholder text flashing before the real name appears.
  if (!hasHydrated) {
    return (
      <div className="flex items-center gap-3 rounded-full bg-gray-50 px-3 py-1.5 border border-gray-200" aria-hidden>
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200" />
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-2 w-14 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 rounded-full bg-gray-50 px-3 py-1.5 hover:bg-gray-100 border border-gray-200 transition-colors"
      >
        <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-brand-400 text-gray-900 text-xs font-semibold">
          {initials}
        </div>
        {/* min-w-0 lets these truncate instead of overflowing the sidebar's
            fixed width — displayName falls back to the raw email, which has
            no natural break point to wrap on. */}
        <div className="flex min-w-0 flex-1 flex-col items-start leading-tight mr-1">
          <span className="w-full truncate text-xs font-semibold text-gray-900 text-left">
            {displayName}
          </span>
          <span className="w-full truncate text-[11px] text-gray-500 text-left">{roleLabel}</span>
        </div>
        <ChevronUp className="w-4 h-4 shrink-0 text-gray-500" />
      </button>

      {open && (
        <div
          className={`absolute w-56 rounded-2xl bg-white shadow-lg border border-gray-100 py-2 z-50 animate-dropdown ${
            menuPlacement === 'right'
              ? 'left-full top-0 ml-2'
              : menuPlacement === 'top'
              ? 'left-0 bottom-full mb-2'
              : 'right-0 mt-2'
          }`}
        >
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
            onClick={() => router.push(`/dashboard/my-clinic/staff/${user?.id}`)}
          >
            <User className="w-4 h-4 text-gray-500" />
            <span>Profile</span>
          </button>
          <button
            type="button"
            disabled={loggingOut}
            onClick={async () => {
              setOpen(false);
              try {
                await logoutAsync();
              } catch {
                // Toast surfaced by the mutation's onError handler;
                // local cleanup + redirect happen in onSettled.
              }
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{loggingOut ? 'Logging out…' : 'Logout'}</span>
          </button>
        </div>
      )}
    </div>
  );
}


