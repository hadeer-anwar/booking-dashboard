// components/dashboard/charts/chart-config.ts
export const CHART_TOOLTIP = {
    contentStyle: {
      borderRadius: '12px',
      border: '1px solid #e8e0dc',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
      fontSize: '12px',
      background: 'white',
    },
    labelStyle: { fontWeight: 600, color: '#241f20' },
  };
  
  // Keys must match AppointmentStatus exactly (appointment.model.ts's
  // APPOINTMENT_STATUSES) — a mismatched key silently falls back to a
  // generic gray + the raw snake_case string in StatusDistributionChart,
  // which is easy to miss entirely since it's the same gray as "cancelled".
  //
  // Warm accent family (brand/gold/tan/gray, from app/globals.css) instead
  // of a traffic-light palette — matches the reference dashboard's own
  // status-badge/chart colors, which don't use red/green/blue for outcomes.
  export const STATUS_COLORS: Record<string, string> = {
    pending_assignment: '#8f827e', // gray-500
    pending: '#fff19e', // gold-400
    confirmed: '#f485a3', // brand-400
    completed: '#e2b38c', // tan-400
    cancelled: '#d6cbc6', // gray-300
    no_show: '#b23760', // brand-700
  };

  export const STATUS_LABELS: Record<string, string> = {
    pending_assignment: 'Pending Assignment',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };