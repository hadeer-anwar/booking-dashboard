import { parseImagesFromUnknown } from '@/src/lib/api/media';
import { normalizeService } from '@/src/features/services/api/serviceNormalize';
import type { Service } from '@/src/features/services/types/types';
import type { ClinicSchedule } from '@/src/features/schedule/types/types';
import type {
  Clinic,
  ClinicCategory,
  ClinicStaffUser,
  RawClinicDetail,
  RawClinicFromList,
  RawStaffUser,
} from '../types/types';

export function normalizeStaffUser(raw: RawStaffUser): ClinicStaffUser {
  const fullName =
    raw.fullName?.trim() ||
    [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim() ||
    raw.email;
  return {
    id: raw.id,
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    fullName,
    phoneNumber: raw.phoneNumber,
    isActive: raw.isActive ?? true,
    role: raw.role as ClinicStaffUser['role'],
    clinicIds: raw.clinicIds ?? [],
  };
}

export function normalizeClinicDetail(raw: RawClinicDetail): Clinic {
  const schedule: ClinicSchedule | undefined = raw.schedule
    ? {
        workingDays: raw.schedule.workingDays.map((wd) => ({
          day: wd.day,
          isOpen: wd.isOpen,
          hours: (wd.hours ?? []).map((h) => ({
            start: h.start ?? '00:00',
            end: h.end ?? '00:00',
          })),
        })),
      }
    : undefined;

  const categories: ClinicCategory[] = (raw.categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? '',
    images: parseImagesFromUnknown((c as { images?: unknown }).images),
  }));

  const staff = raw.staff
    ? {
        doctors: (raw.staff.providers ?? []).map(normalizeStaffUser),
        clinicAdmin: (raw.staff.clinicAdmin ?? []).map(normalizeStaffUser),
      }
    : undefined;

  const servicesCount =
    raw.servicesCount ??
    raw.services_count ??
    raw._count?.services ??
    (Array.isArray(raw.services) ? raw.services.length : undefined);

  const providersCount =
    raw.providersCount ??
    raw.providers_count ??
    raw._count?.providers ??
    (Array.isArray(raw.staff?.providers) ? raw.staff!.providers!.length : undefined);

  const clinicAdminsCount =
    raw.clinicAdminsCount ??
    raw.clinic_admins_count ??
    raw._count?.clinicAdmins ??
    (Array.isArray(raw.staff?.clinicAdmin) ? raw.staff!.clinicAdmin!.length : undefined);

  return {
    id: raw.id,
    name: raw.name,
    address: raw.address,
    about: raw.about,
    phone: raw.phone,
    type: raw.type,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    schedule,
    categories: categories.length ? categories : undefined,
    staff,
    services: Array.isArray(raw.services)
      ? (raw.services as unknown[]).map((s) => {
          const n = normalizeService(s);
          return { ...n, providers: n.providersCount ?? [] } as Service;
        })
      : [],
    images: parseImagesFromUnknown(raw.images),
    servicesCount,
    providersCount,
    clinicAdminsCount,
  };
}

export function normalizeClinicFromList(raw: RawClinicFromList): Clinic {
  const schedule: ClinicSchedule | undefined = raw.schedule
    ? {
        workingDays: raw.schedule.workingDays.map((wd) => ({
          day: wd.day,
          isOpen: wd.isOpen,
          hours: (wd.hours ?? []).map((h) => ({
            start: h.start ?? '00:00',
            end: h.end ?? '00:00',
          })),
        })),
      }
    : undefined;

  const categories: ClinicCategory[] = (raw.categories ?? []).map((name, index) => ({
    id: `cat-${raw.id}-${index}-${String(name)}`,
    name: String(name),
    description: '',
  }));

  const servicesLen = Array.isArray(raw.services) ? raw.services.length : undefined;
  const providersLen = Array.isArray(raw.staff?.providers) ? raw.staff.providers.length : undefined;

  const servicesCount =
    raw.servicesCount ?? raw.services_count ?? raw._count?.services ?? servicesLen;

  const providersCount =
    raw.providersCount ??
    raw.providers_count ??
    raw.doctorsCount ??
    raw._count?.providers ??
    providersLen;

  return {
    id: raw.id,
    name: raw.name,
    address: raw.address,
    isActive: raw.isActive ?? true,
    phone: raw.phone,
    type: raw.type,
    schedule,
    categories: categories.length ? categories : undefined,
    servicesCount,
    providersCount,
    doctorsCount: providersCount,
    services: Array.isArray(raw.services) ? (raw.services as Service[]) : undefined,
    images: parseImagesFromUnknown(raw.images),
  };
}
