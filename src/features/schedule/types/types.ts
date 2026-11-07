/** One day for schedule payload; backend uses startMinutes/endMinutes as 24h "HH:MM" strings */
export interface ScheduleWorkingDayPayload {
  day: string;
  isOpen: boolean;
  hours: Array<{ startMinutes: string; endMinutes: string }>;
}

/** PATCH /clinics/:id/schedule — update schedule (one or more days, or the full week) */
export interface UpdateSchedulePartialPayload {
  workingDays: ScheduleWorkingDayPayload[];
}

/** Single time slot; times are 24h "HH:MM" as returned by backend */
export interface ClinicScheduleHour {
  start: string;
  end: string;
}

export interface ClinicWorkingDay {
  day: string;
  hours: ClinicScheduleHour[];
  isOpen: boolean;
}

export interface ClinicSchedule {
  workingDays: ClinicWorkingDay[];
}
