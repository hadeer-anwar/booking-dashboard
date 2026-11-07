'use client';

import { useSyncExternalStore } from 'react';

function subscribe(query: string, onChange: () => void) {
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener('change', onChange);
  return () => mediaQueryList.removeEventListener('change', onChange);
}

/**
 * Tracks whether a media query currently matches, updating live on resize.
 * Used instead of a Tailwind responsive-prefix class where the breakpoint
 * needs to be guaranteed correct at runtime regardless of the CSS build
 * (e.g. a custom screen size that isn't one of Tailwind's stock
 * sm/md/lg/xl/2xl values, where relying on the generated stylesheet having
 * picked up a config change is an extra point of failure).
 *
 * Built on `useSyncExternalStore` — React's dedicated primitive for
 * subscribing to external, non-React state like a browser API — rather
 * than `useEffect` + `setState`, which is the officially-flagged
 * anti-pattern for exactly this "sync from an external source" case.
 * SSR-safe: the server snapshot is `false`, so the very first client render
 * may briefly show the "doesn't match" layout before this corrects itself
 * post-hydration.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => window.matchMedia(query).matches,
    () => false
  );
}
