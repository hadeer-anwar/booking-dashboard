'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useMediaQuery } from '@/src/hooks/useMediaQuery';
import { Sidebar } from './Sidebar';

interface DashboardShellProps {
  children: ReactNode;
}

const DESKTOP_QUERY = '(min-width: 1200px)';

/**
 * Owns the mobile/tablet drawer's open state so it can be shared between the
 * hamburger trigger (in this shell's own top bar) and the Sidebar drawer
 * itself — they're siblings, not parent/child, so the state has to live
 * here rather than inside Sidebar.
 *
 * The desktop/drawer switch is driven by `useMediaQuery` (real
 * `window.matchMedia`) rather than a Tailwind responsive-prefix class —
 * 1200px isn't one of Tailwind's stock breakpoints, and a runtime check
 * removes any dependency on the CSS build having picked up a custom screen
 * size correctly.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  // Auto-close on navigation — covers Link clicks (which already close it
  // directly for a snappier feel) plus back/forward and any programmatic
  // navigation that wouldn't otherwise fire a click handler. Adjusted
  // during render (React's documented pattern for resetting state when a
  // prop changes) rather than in an effect, which would cost an extra
  // render pass every single navigation just to close an already-closed
  // drawer on desktop.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  // Lock background scroll while the drawer is open, same convention as a
  // modal — otherwise the page behind it scrolls along with touch drags.
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50/70">
      {/* Backdrop — click-outside-to-close. Only ever rendered below the
          desktop breakpoint, where the sidebar is a drawer overlay. */}
      {mobileOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar isDesktop={isDesktop} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile/tablet top bar — only rendered below the desktop
            breakpoint, where the sidebar isn't always on-screen. */}
        {!isDesktop && (
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="-ml-1.5 inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/bookedby-lola.webp"
              alt="booked by lola"
              className="h-6 w-auto max-w-[140px] object-contain object-left"
            />
          </header>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">{children}</main>
      </div>
    </div>
  );
}
