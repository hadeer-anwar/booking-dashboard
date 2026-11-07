interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

/** Generic Active/Inactive dot badge. For appointment lifecycle status, use AppointmentStatusBadge instead. */
export function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
