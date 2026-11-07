'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KebabMenuProps {
  /** Render prop so items can close the menu explicitly before firing an action
   *  (some callers defer the action by a tick to let the menu's portal unmount
   *  first — e.g. when the action opens another modal). */
  children: (close: () => void) => ReactNode;
  ariaLabel?: string;
}

/**
 * Trigger button + positioned dropdown, portaled to `document.body` so it
 * escapes any `overflow-hidden`/stacking-context ancestor (table rows, cards).
 * Closes on outside click, Escape, scroll, or resize.
 */
export function KebabMenu({ children, ariaLabel = 'More actions' }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      // No measured menu height available yet (content is dynamic per
      // caller), so use a heuristic: flip upward when there's clearly not
      // enough room below for a typical menu but there is above — covers
      // the common case of a kebab trigger in one of the last visible rows
      // on a short/mobile viewport, without needing a measure-then-position
      // extra render pass.
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 220 && rect.top > spaceBelow;
      setPos({
        ...(openUpward ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(true);
  };

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-opacity hover:bg-gray-100 hover:text-gray-600 focus:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
        aria-label={ariaLabel}
      >
        <MoreVertical className="h-4.5 w-4.5" />
      </button>

      {typeof document !== 'undefined' &&
        open &&
        pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              role="menu"
              className="fixed z-50 min-w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5"
              style={{ top: pos.top, bottom: pos.bottom, right: pos.right }}
            >
              {children(() => setOpen(false))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

type KebabMenuItemTone = 'default' | 'danger' | 'warning' | 'success' | 'accent' | 'info';

const TONE_CLASSES: Record<KebabMenuItemTone, string> = {
  default: 'text-gray-700 hover:bg-gray-50',
  danger: 'text-red-600 hover:bg-red-50',
  warning: 'text-amber-800 hover:bg-amber-50',
  success: 'text-emerald-800 hover:bg-emerald-50',
  accent: 'text-violet-600 hover:bg-violet-50',
  info: 'text-blue-600 hover:bg-blue-50',
};

const TONE_ICON_CLASSES: Record<KebabMenuItemTone, string> = {
  default: 'text-gray-400',
  danger: '',
  warning: 'text-amber-600',
  success: 'text-emerald-600',
  accent: '',
  info: '',
};

interface KebabMenuItemProps {
  icon: LucideIcon;
  onClick: () => void;
  children: ReactNode;
  tone?: KebabMenuItemTone;
  disabled?: boolean;
}

export function KebabMenuItem({ icon: Icon, onClick, children, tone = 'default', disabled = false }: KebabMenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${TONE_CLASSES[tone]}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${TONE_ICON_CLASSES[tone]}`} />
      {children}
    </button>
  );
}

export function KebabMenuSeparator() {
  return <div className="my-1 border-t border-gray-100" role="separator" />;
}
