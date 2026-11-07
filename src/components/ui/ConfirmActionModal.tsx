'use client';

import type { ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_SCROLL_CLASS } from './modal-shell';

export interface ConfirmActionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  confirmLabel: string;
  confirmingLabel?: string;
  confirmIcon?: LucideIcon;
  cancelLabel?: string;
  tone?: 'danger' | 'dark';
  isSubmitting?: boolean;
  disableConfirm?: boolean;
  layout?: 'compact' | 'sectioned';
}


export const ConfirmActionModal = ({
  open,
  onClose,
  onConfirm,
  icon: Icon,
  title,
  description,
  children,
  confirmLabel,
  confirmingLabel,
  confirmIcon: ConfirmIcon,
  cancelLabel,
  tone = 'danger',
  isSubmitting = false,
  disableConfirm = false,
  layout = 'compact',
}: ConfirmActionModalProps) => {
  if (!open) return null;

  const confirmButtonTone =
    tone === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-red-600 hover:bg-red-700';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || disableConfirm) return;
    onConfirm();
  };

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        aria-label="Close"
        className="shrink-0 rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const footer = (
    <>
      {cancelLabel && (
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-full border border-gray-300 px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="submit"
        disabled={isSubmitting || disableConfirm}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors disabled:opacity-50 ${confirmButtonTone}`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {confirmingLabel ?? confirmLabel}
          </>
        ) : (
          <>
            {ConfirmIcon && <ConfirmIcon className="h-4 w-4" />}
            {confirmLabel}
          </>
        )}
      </button>
    </>
  );

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_SCROLL_CLASS}>
        {layout === 'sectioned' ? (
          <form onSubmit={handleSubmit}>
            <div className="border-b border-gray-100 px-6 pb-4 pt-5">{header}</div>
            <div className="space-y-4 px-6 pb-5 pt-4">
              {children}
              <div className="flex flex-col-reverse items-center justify-end gap-2 border-t border-gray-100 pt-2 sm:flex-row">
                {footer}
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">{header}</div>
            {children && <div className="mb-5 text-xs text-gray-700">{children}</div>}
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">{footer}</div>
          </form>
        )}
      </div>
    </div>
  );
};
