import { api } from '@/src/lib/api/axios';
import type { LoginRequest, LoginResponse, User } from '@/src/types';

const VALID_ROLES: User['role'][] = ['super_admin', 'clinic_admin', 'moderator', 'doctor'];

/** API may return `clinics: ["id"]` or populated objects with `id`. */
function pickFirstClinicIdFromClinicsField(clinics: unknown): string | undefined {
  if (!Array.isArray(clinics) || clinics.length === 0) return undefined;
  const first = clinics[0];
  if (typeof first === 'string' && first.trim()) return first.trim();
  if (first && typeof first === 'object' && 'id' in first) {
    const id = (first as { id: unknown }).id;
    if (id != null && String(id).trim()) return String(id);
  }
  return undefined;
}


function pickField(raw: Record<string, unknown>, camelKey: string, snakeKey: string): unknown {
  const camel = raw[camelKey];
  if (camel != null && String(camel).trim() !== '') return camel;
  const snake = raw[snakeKey];
  if (snake != null && String(snake).trim() !== '') return snake;
  return undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** Normalize user from API (firstName/lastName or fullName, camelCase or snake_case) to User */
function normalizeUser(raw: Record<string, unknown>): User {
  const firstName = String(pickField(raw, 'firstName', 'first_name') ?? '').trim();
  const lastName = String(pickField(raw, 'lastName', 'last_name') ?? '').trim();
  const fullNameFromNames = [firstName, lastName].filter(Boolean).join(' ');

  const fullName =
    [pickField(raw, 'fullName', 'full_name'), raw.name, fullNameFromNames, raw.email].find(
      isNonEmptyString
    )?.trim() || 'User';

  const roleRaw = (raw.role ?? 'clinic_admin') as string;
  const role: User['role'] = VALID_ROLES.includes(roleRaw as User['role'])
    ? (roleRaw as User['role'])
    : 'clinic_admin';

  const clinicIdRaw =
    pickField(raw, 'clinicId', 'clinic_id') ??
    (Array.isArray(raw.clinicIds) && raw.clinicIds.length ? raw.clinicIds[0] : undefined) ??
    pickFirstClinicIdFromClinicsField(raw.clinics);

  const phoneNumberRaw = pickField(raw, 'phoneNumber', 'phone_number');
  const isActiveRaw = pickField(raw, 'isActive', 'is_active');

  return {
    id: String(raw.id ?? raw._id ?? ''),
    email: String(raw.email ?? ''),
    fullName,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    phoneNumber: phoneNumberRaw != null ? String(phoneNumberRaw) : undefined,
    country: raw.country != null ? String(raw.country) : undefined,
    isActive: isActiveRaw != null ? Boolean(isActiveRaw) : undefined,
    role,
    clinicId: clinicIdRaw ? String(clinicIdRaw) : undefined,
  };
}

/** Extract an access token if the backend chose to include one in the body. */
function extractAccessToken(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const p = payload as Record<string, unknown>;
  const data = p.data && typeof p.data === 'object' ? (p.data as Record<string, unknown>) : undefined;
  const tokens = p.tokens && typeof p.tokens === 'object' ? (p.tokens as Record<string, unknown>) : undefined;

  const candidate =
    p.accessToken ??
    p.access_token ??
    p.token ??
    data?.accessToken ??
    data?.access_token ??
    data?.token ??
    tokens?.accessToken ??
    tokens?.access_token;

  return typeof candidate === 'string' ? candidate : '';
}

/** Extract the user object regardless of whether it's nested under `data`. */
function extractRawUser(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const p = payload as Record<string, unknown>;
  if (p.user && typeof p.user === 'object') return p.user as Record<string, unknown>;
  if (p.data && typeof p.data === 'object') {
    const d = p.data as Record<string, unknown>;
    if (d.user && typeof d.user === 'object') return d.user as Record<string, unknown>;
    if (d.email || d.role || d.id) return d;
  }
  // Sometimes the root IS the user
  if (p.email || p.role || p.id) return p;
  return {};
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    const accessToken = extractAccessToken(response.data);
    const user = normalizeUser(extractRawUser(response.data));
    return { accessToken, user };
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    await api.patch('/auth/change-password', payload);
  },
};
