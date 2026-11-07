import type {
  RawAppointmentPerson,
  RawAppointmentClinic,
  RawAppointmentService,
  RawAppointment,
  AppointmentStatus,
  AppointmentPerson,
  AppointmentService,
  AppointmentClinic,
  Appointment,
  RawAvailableProvider,
  AvailableAppointmentProvider,
} from '../types/types';

/** Convert minutes-since-midnight → "HH:MM" (24h). */
function minutesToHHMM(min: number | undefined): string | undefined {
  if (typeof min !== 'number' || !Number.isFinite(min)) return undefined;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function pickId(raw: { id?: string; _id?: string } | undefined): string {
  return String(raw?.id ?? raw?._id ?? '');
}

function normalizePerson(
  raw: RawAppointmentPerson | undefined,
  fallbackId?: string
): AppointmentPerson {
  const id = pickId(raw) || fallbackId || '';
  const firstName = raw?.firstName ?? '';
  const lastName = raw?.lastName ?? '';
  const fullName =
    raw?.fullName?.trim() ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    raw?.email ||
    id;

  return {
    id,
    firstName,
    lastName,
    fullName,
    email: raw?.email,
    phoneNumber: raw?.phoneNumber,
  };
}

export function normalizeAvailableProvider(raw: RawAvailableProvider): AvailableAppointmentProvider {
  const firstName = raw.firstName ?? '';
  const lastName = raw.lastName ?? '';
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ').trim() || raw.email || raw.id;

  return {
    id: raw.id,
    fullName,
    email: raw.email,
    phoneNumber: raw.phoneNumber,
    specialty: raw.specialty,
    source: raw.source,
  };
}

function normalizeClinic(
  raw: RawAppointmentClinic | undefined,
  fallbackId?: string
): AppointmentClinic {
  return {
    id: pickId(raw) || fallbackId || '',
    name: raw?.name,
    address: raw?.address,
  };
}

function normalizeService(
  raw: RawAppointmentService | undefined,
  fallbackId?: string,
  fallbackPrice?: number
): AppointmentService {
  return {
    id: pickId(raw) || fallbackId || '',
    name: raw?.name ?? '',
    duration: Number(raw?.duration ?? 0),
    price: Number(raw?.price ?? fallbackPrice ?? 0),
  };
}

export function normalizeAppointment(raw: RawAppointment): Appointment {

  const start =
    raw.start ??
    minutesToHHMM(raw.startMinutes) ??
    '';
  const end =
    raw.end ??
    minutesToHHMM(raw.endMinutes) ??
    '';

  return {
    id: pickId(raw),
    date: raw.date ?? '',
    start,
    end,
    status: (raw.status ?? 'pending') as AppointmentStatus,
    notes: raw.notes,
    clinic: normalizeClinic(raw.clinic, raw.clinicId),
    service: normalizeService(raw.service, raw.serviceId, raw.servicePrice),
    provider: raw.provider || raw.providerId
      ? normalizePerson(raw.provider, raw.providerId)
      : undefined,
    customer: normalizePerson(raw.customer, raw.customerId),
    servicePrice: Number(raw.servicePrice ?? 0),
  };
}
