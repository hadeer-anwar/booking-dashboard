/** Resolve API-relative or absolute image URLs for <img src>. */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const u = url.trim();
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:') || u.startsWith('blob:')) {
    return u;
  }
  const base = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
  return u.startsWith('/') ? `${base}${u}` : `${base}/${u}`;
}

/** Normalize images from API (array of strings, single string, or nested). */
export function parseImagesFromUnknown(raw: unknown): string[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) {
    const urls = raw
      .map((x) => (typeof x === 'string' ? x : typeof x === 'object' && x && 'url' in x ? String((x as { url: unknown }).url) : ''))
      .map((s) => s.trim())
      .filter(Boolean);
    return urls.length ? urls : undefined;
  }
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
  return undefined;
}

export function appendImageFiles(formData: FormData, files: File[] | undefined): void {
  if (!files?.length) return;
  for (const file of files) {
    formData.append('images', file);
  }
}
