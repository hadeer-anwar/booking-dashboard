/**
 * Shared modal frame for consistent width, height cap, and overlay behavior.
 *
 * - Max width: 2xl (42rem) site-wide
 * - Max height: 90dvh so dialogs stay on screen; content scrolls inside the panel
 * - Small viewports: panel sits toward the bottom (sheet-like); sm+ centers vertically
 */
export const MODAL_OVERLAY_CLASS =
  'fixed inset-0 z-50 flex min-h-full items-end justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs sm:items-center';

/** Panel with a fixed header/footer: use with inner `flex-1 min-h-0 overflow-y-auto` for body. */
export const MODAL_PANEL_CLASS =
  'relative flex w-full max-w-2xl max-h-[90dvh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl';

/** Entire panel scrolls (header/footer scroll away). Prefer MODAL_PANEL_CLASS + body scroll when you need a sticky header. */
export const MODAL_PANEL_SCROLL_CLASS =
  'relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto overflow-x-hidden rounded-2xl border border-gray-200 bg-white shadow-xl';
