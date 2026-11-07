import { parseImagesFromUnknown } from '@/src/lib/api/media';
import type { Category } from '../types/types';

export function normalizeCategory(raw: unknown): Category {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    description: typeof r.description === 'string' ? r.description : undefined,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : typeof r.created_at === 'string' ? r.created_at : undefined,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : typeof r.updated_at === 'string' ? r.updated_at : undefined,
    images: parseImagesFromUnknown(r.images),
  };
}
