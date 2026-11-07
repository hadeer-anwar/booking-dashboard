'use client';

import type { AppointmentStatus } from '../types/types';

// Warm accent family (brand/gold/tan/gray, from app/globals.css) instead of
// a traffic-light palette — matches the reference dashboard's own
// status-badge colors, and the same mapping chart-config.ts's
// STATUS_COLORS uses for the dashboard's status donut, so a status reads as
// the same color everywhere it appears in the app. Matches the reference's
// own text-color choice per status too: only "Confirmed" gets a tinted-dark
// text color (text-accent-primary-800) — "Pending"/"Completed" sit on a
// pastel tint but use plain near-black text, which reads noticeably darker/
// clearer than a same-hue dark tint would on top of an already-pale background.
const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  pending_assignment: {
    label: 'Pending Assignment',
    className: 'bg-gray-200 text-gray-800 ring-1 ring-gray-300',
  },
  pending: {
    label: 'Pending',
    className: 'bg-gold-100 text-gray-900 ring-1 ring-gold-400/40',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-brand-100 text-brand-800 ring-1 ring-brand-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-tan-100 text-gray-900 ring-1 ring-tan-400/40',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
  },
};

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}

export const AppointmentStatusBadge = ({
  status,
  size = 'sm',
}: AppointmentStatusBadgeProps) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${config.className} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
    >
      {config.label}
    </span>
  );
};
