import { parseImagesFromUnknown } from '@/src/lib/api/media';
import type { Service } from '../types/types';

export function normalizeService(raw: unknown): Service {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    clinicId: String(r.clinicId ?? r.clinic_id ?? ''),
    categoryId: String(r.categoryId ?? r.category_id ?? ''),
    duration: Number(r.duration ?? 0),
    price: r.price !== undefined && r.price !== null ? Number(r.price) : undefined,
    isActive: Boolean(r.isActive ?? r.is_active ?? true),
    isOpenAllTime: Boolean(r.isOpenAllTime ?? r.is_open_all_time),
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ''),
    description: typeof r.description === 'string' ? r.description : typeof r.describtion === 'string' ? r.describtion : undefined,
    images: parseImagesFromUnknown(r.images),
    providersCount: Number(r.providersCount ?? 0),
  };
}
