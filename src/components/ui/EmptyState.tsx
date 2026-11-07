'use client';

import type { LucideIcon } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  /**
   * 'bold' (rounded-2xl card, semibold CTA) is used by the main list pages
   * (appointments, categories, services). 'subtle' (rounded-xl card, medium
   * CTA) matches the smaller nested-tab contexts (clinics list, clinic staff
   * tab, clinic services tab).
   */
  variant?: 'bold' | 'subtle';
  /** Tighter vertical padding + CTA spacing, for contexts nested inside a detail page. */
  compact?: boolean;
}

const BOLD_CONTAINER =
  'flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center';
const SUBTLE_CONTAINER =
  'flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center';

const BOLD_BUTTON =
  'mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-5 py-2.5 text-xs font-semibold text-gray-900 transition-colors duration-200 hover:bg-brand-500 active:scale-95';
const SUBTLE_BUTTON =
  'inline-flex items-center gap-1.5 rounded-xl bg-brand-400 py-2.5 text-xs font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'bold',
  compact = false,
}: EmptyStateProps) {
  const isBold = variant === 'bold';

  return (
    <div className={`${isBold ? BOLD_CONTAINER : SUBTLE_CONTAINER} ${compact ? 'py-16' : 'py-20'}`}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className={`mt-1 max-w-sm text-xs text-gray-500 ${isBold ? 'leading-relaxed' : ''}`}>{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={`${isBold ? BOLD_BUTTON : SUBTLE_BUTTON} ${!isBold ? (compact ? 'mt-5 px-4' : 'mt-6 px-5') : ''}`}
        >
          {action.icon ? <action.icon className="h-3.5 w-3.5" /> : null}
          {action.label}
        </button>
      )}
    </div>
  );
}
