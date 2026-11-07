import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format 24h "HH:MM" time string to 12h AM/PM (e.g. "09:30" → "9:30 AM", "13:30" → "1:30 PM").
 */
export function formatTime24To12(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const displayMinutes = m.toString().padStart(2, '0');
  return `${displayHour}:${displayMinutes} ${period}`;
}

/** Normalize time to 24h "HH:MM" for backend (e.g. "9:30" → "09:30"). */
export function to24hString(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Single validation item from API (e.g. Zod-style) */
interface ApiValidationErrorItem {
  message?: string;
  path?: (string | number)[];
  code?: string;
}

interface ApiErrorBody {
  message?: string;
  errors?: ApiValidationErrorItem[];
}

/**
 * Build a user-visible message from axios/API errors.
 * Handles `{ message, errors: [{ message, path }] }` validation responses.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  const data = (err as { response?: { data?: ApiErrorBody } })?.response?.data;
  if (!data) {
    return (err as Error)?.message ?? fallback;
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const parts = data.errors
      .map((e) => {
        const msg = e.message?.trim();
        if (!msg) return null;
        const field =
          Array.isArray(e.path) && e.path.length > 0
            ? `${String(e.path[e.path.length - 1])}: `
            : '';
        return `${field}${msg}`;
      })
      .filter((s): s is string => Boolean(s));
    if (parts.length > 0) {
      return parts.join(' · ');
    }
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }

  return (err as Error)?.message ?? fallback;
}

/** True when response includes a validation `errors` array */
export function hasApiValidationErrors(err: unknown): boolean {
  const errors = (err as { response?: { data?: ApiErrorBody } })?.response?.data?.errors;
  return Array.isArray(errors) && errors.length > 0;
}