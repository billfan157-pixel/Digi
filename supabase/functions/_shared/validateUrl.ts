/**
 * Shared redirect URL validator for Supabase Edge Functions.
 * Prevents open-redirect attacks by enforcing protocol, host, and IP allowlists.
 */

const DANGEROUS_PROTOCOLS = new Set([
  'javascript:', 'data:', 'file:', 'ftp:', 'ftps:', 'mailto:', 'tel:', 'vbscript:',
]);

const LOCALHOST_HOSTS = new Set([
  'localhost', '127.0.0.1', '[::1]', '::1',
]);

function isPrivateIp(host: string): boolean {
  // Strip IPv6 brackets
  const h = host.replace(/^\[/, '').replace(/\]$/, '');

  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false; // localhost is handled separately

  // IPv4 private ranges
  if (/^10\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^127\./.test(h)) return true; // loopback outside localhost

  // IPv6 loopback / link-local / unique-local
  if (/^fc00:/i.test(h)) return true;
  if (/^fe80:/i.test(h)) return true;
  if (/^::1$/.test(h)) return true;
  if (/^ff00:/i.test(h)) return true;

  return false;
}

/**
 * Validate a redirect/callback URL against an allowlist of origins.
 *
 * Rules:
 * 1. Must be non-empty.
 * 2. No credentials (user:pass@host).
 * 3. Protocol must be https (production), http (localhost only), or a known deep-link scheme.
 * 4. Host must not be a private IP (10.x, 172.16-31, 192.168, 169.254, fc00, fe80, etc.).
 * 5. For http://, host must be localhost / 127.0.0.1 / ::1.
 * 6. For deep-link schemes (digiwell://, capacitor://), host must be localhost or absent (no host means treat as safe for mobile deep links).
 * 7. For https://, origin must match one of the allowedOrigins entries exactly.
 */
export function validateRedirectUrl(
  url: string,
  allowedOrigins: string[],
): { valid: boolean; reason?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, reason: 'URL is empty.' };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, reason: 'URL is empty.' };
  }

  const lower = trimmed.toLowerCase();

  // Block dangerous protocols immediately
  for (const proto of DANGEROUS_PROTOCOLS) {
    if (lower.startsWith(proto)) {
      return { valid: false, reason: `Dangerous protocol blocked: ${proto}` };
    }
  }

  // Allow exact digiwell:// and capacitor:// deep links (mobile)
  // We only allow the scheme with localhost or no authority to prevent
  // open redirects like digiwell://evil.com
  if (lower.startsWith('digiwell://') || lower.startsWith('capacitor://')) {
    // Must be exactly digiwell://localhost or digiwell:// with a safe path
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();
      // If there is a host, it must be localhost
      if (host && !LOCALHOST_HOSTS.has(host)) {
        return { valid: false, reason: `Deep-link host not allowed: ${host}` };
      }
      // No credentials
      if (parsed.username || parsed.password) {
        return { valid: false, reason: 'URL must not contain credentials.' };
      }
      return { valid: true };
    } catch {
      // If parsing fails but it starts with allowed scheme, treat as safe mobile deep link
      return { valid: true };
    }
  }

  // Parse standard URLs
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'Invalid URL format.' };
  }

  // No credentials
  if (parsed.username || parsed.password) {
    return { valid: false, reason: 'URL must not contain credentials.' };
  }

  const protocol = parsed.protocol;
  const host = parsed.hostname.toLowerCase();

  // Block private IPs for all protocols
  if (isPrivateIp(host)) {
    return { valid: false, reason: 'Private IP addresses are not allowed.' };
  }

  if (protocol === 'http:') {
    if (!LOCALHOST_HOSTS.has(host)) {
      return { valid: false, reason: 'http:// is only allowed for localhost.' };
    }
    return { valid: true };
  }

  if (protocol === 'https:') {
    const origin = parsed.origin;
    const match = allowedOrigins.some((allowed) => {
      const a = allowed.trim();
      return a && origin.toLowerCase() === a.toLowerCase();
    });
    if (!match) {
      return { valid: false, reason: 'Origin not in allowlist.' };
    }
    return { valid: true };
  }

  return { valid: false, reason: `Protocol not allowed: ${protocol}` };
}
