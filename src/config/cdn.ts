export const CDN_CONFIG = {
  baseUrl: import.meta.env.VITE_CDN_BASE_URL || '',
  images: {
    supabaseTransform: true,
    quality: 80,
    format: 'auto' as const,
  },
  cacheControl: {
    static: 'public, max-age=31536000, immutable',
    api: 'public, max-age=60, stale-while-revalidate=300',
    userContent: 'public, max-age=86400',
  },
};

export function getAssetUrl(path: string): string {
  if (!CDN_CONFIG.baseUrl) return path;
  const base = CDN_CONFIG.baseUrl.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
}

export function getOptimizedImageUrl(supabaseUrl: string, width = 200, height = 200): string {
  if (!CDN_CONFIG.images.supabaseTransform) return supabaseUrl;
  try {
    const url = new URL(supabaseUrl);
    url.searchParams.set('width', String(width));
    url.searchParams.set('height', String(height));
    url.searchParams.set('quality', String(CDN_CONFIG.images.quality));
    url.searchParams.set('format', CDN_CONFIG.images.format);
    return url.toString();
  } catch {
    return supabaseUrl;
  }
}
