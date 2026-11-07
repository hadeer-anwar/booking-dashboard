import type { ClinicSchedule, ClinicWorkingDay, ScheduleWorkingDayPayload } from '@/src/features/schedule/types/types';
import type { UpdateClinicStaffSchedulePayload } from '@/src/features/staff/types/types';
import { ALL_DAYS, type DayName, type SlotDraft } from '../types/types';
import { to24hString } from '@/src/utils/helpers';

/* ─── ID generator (stable client-side key for React lists) ──────────────── */

function newSlotId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ─── SlotDraft helpers (used by ClinicStaffMemberDetailPage display) ────── */

/** Creates a new SlotDraft with optional default times. */
export function emptySlot(start = '09:00', end = '17:00'): SlotDraft {
  return { clientId: newSlotId(), start, end };
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

export const ALL_WEEKDAYS = ALL_DAYS;

export type Weekday = DayName;

export interface TimeSlot {
  start: string;
  end: string;
}


export interface DayState {
  day: string;
  isOpen: boolean;
  hours: TimeSlot[];
}


export interface DayEditor {
  day: string;
  isOpen: boolean;
  slots: SlotDraft[];
}

/* ─── Normalisation helpers ───────────────────────────────────────────────── */

/** Trims a time string to "HH:MM", falling back to the given default. */
function normaliseTime(value: string | null | undefined, fallback: string): string {
  return (value ?? fallback).slice(0, 5);
}

/** Returns a default closed DayState for a given day name. */
export function defaultDay(day: string): DayState {
  return { day, isOpen: false, hours: [] };
}

/** Converts a raw ClinicWorkingDay (API read shape) into a DayState. */
export function workingDayToDayState(wd: ClinicWorkingDay): DayState {
  return {
    day: wd.day,
    isOpen: wd.isOpen,
    hours: (wd.hours ?? []).map((h) => ({
      start: normaliseTime(h.start, '09:00'),
      end: normaliseTime(h.end, '17:00'),
    })),
  };
}


export function scheduleToDayStates(schedule: ClinicSchedule | null | undefined): DayState[] {
  const byDay = new Map(
    (schedule?.workingDays ?? []).map((wd) => [wd.day, workingDayToDayState(wd)])
  );
  return ALL_WEEKDAYS.map((d) => byDay.get(d) ?? defaultDay(d));
}


export function scheduleToDayEditors(schedule: ClinicSchedule | null | undefined): DayEditor[] {
  return ALL_WEEKDAYS.map((dayName) => {
    const wd = schedule?.workingDays?.find((w) => w.day === dayName);

    if (!wd || !wd.isOpen || !wd.hours?.length) {
      return { day: dayName, isOpen: false, slots: [] };
    }

    return {
      day: dayName,
      isOpen: true,
      slots: wd.hours.map((h) => ({
        clientId: newSlotId(),
        start: normaliseTime(h.start, '09:00'),
        end: normaliseTime(h.end, '17:00'),
      })),
    };
  });
}

export function dayFromSchedule(
  dayName: string,
  workingDays: ClinicWorkingDay[] | undefined
): { isOpen: boolean; hours: TimeSlot[] } {
  const found = workingDays?.find((w) => w.day === dayName);
  if (!found) return { isOpen: false, hours: [] };

  return {
    isOpen: found.isOpen,
    hours: (found.hours ?? []).map((h) => ({
      start: normaliseTime(h.start, '09:00'),
      end: normaliseTime(h.end, '17:00'),
    })),
  };
}


export function dayStateToPayload(dayState: DayState): ScheduleWorkingDayPayload {
  return {
    day: dayState.day,
    isOpen: dayState.isOpen,
    hours: dayState.isOpen
      ? dayState.hours.map((h) => ({
          startMinutes: to24hString(h.start),
          endMinutes: to24hString(h.end),
        }))
      : [],
  };
}

export function buildFullSchedulePayload(days: DayState[]): UpdateClinicStaffSchedulePayload {
  return {
    schedule: {
      workingDays: days.map(dayStateToPayload),
    },
  };
}



export function buildSingleDaySchedulePayload(
  editedDay: string,
  isOpen: boolean,
  slots: TimeSlot[],
  _existingSchedule?: ClinicSchedule | null
): UpdateClinicStaffSchedulePayload {
  void _existingSchedule;

  const editedDayPayload: ScheduleWorkingDayPayload = {
    day: editedDay,
    isOpen,
    hours: isOpen
      ? slots.map((h) => ({
          startMinutes: to24hString(h.start),
          endMinutes: to24hString(h.end),
        }))
      : [],
  };

  return {
    schedule: {
      workingDays: [editedDayPayload],
    },
  };
}

/* ─── Validation ──────────────────────────────────────────────────────────── */

export function validateSchedule(days: DayState[]): string | null {
  const openDays = days.filter((d) => d.isOpen);

  if (openDays.some((d) => d.hours.length === 0)) {
    return 'Every open day must have at least one time slot.';
  }

  if (openDays.some((d) => d.hours.some((h) => !h.start || !h.end))) {
    return 'Each time slot must have both a start and an end time.';
  }

  return null;
}


export function validateDaySlots(isOpen: boolean, slots: TimeSlot[]): string | null {
  if (isOpen && slots.length === 0) {
    return 'Add at least one time slot, or mark the day as closed.';
  }

  if (isOpen && slots.some((s) => !s.start || !s.end)) {
    return 'Each slot needs a start and an end time.';
  }

  return null;
}