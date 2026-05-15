const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#61;',
};

const ESCAPE_REGEX = /[&<>"'/`=]/g;

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char] ?? char);
}

export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null;
  try {
    const parsed = new URL(url, 'https://example.com');
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function sanitizeInput(input: string, maxLength = 500): string {
  const trimmed = input.trim().slice(0, maxLength);
  return sanitizeHtml(trimmed);
}

export function stripHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '');
}
