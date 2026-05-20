import { getCorsHeaders } from './cors.ts';

export function getErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes('401') || raw.toLowerCase().includes('invalid api key') || raw.toLowerCase().includes('unauthorized')) {
    return 'Unauthorized.';
  }
  if (raw.includes('429') || raw.toLowerCase().includes('rate limit')) {
    return 'Rate limit exceeded. Try again later.';
  }
  if (raw.includes('503') || raw.toLowerCase().includes('unavailable')) {
    return 'Service temporarily unavailable. Try again later.';
  }
  return raw;
}

export function getErrorStatus(error: unknown): number {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('429') || raw.toLowerCase().includes('rate limit')) return 429;
  if (raw.includes('401') || raw.toLowerCase().includes('invalid api key') || raw.toLowerCase().includes('unauthorized')) return 401;
  if (raw.includes('403') || raw.toLowerCase().includes('forbidden')) return 403;
  if (raw.includes('400') || raw.toLowerCase().includes('bad request')) return 400;
  return 500;
}

export function createErrorResponse(error: unknown, origin: string | null = null): Response {
  const message = getErrorMessage(error);
  const status = getErrorStatus(error);
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...getCorsHeaders(origin),
      'Content-Type': 'application/json',
    },
  });
}

export function createJsonResponse(body: Record<string, unknown>, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(origin),
      'Content-Type': 'application/json',
    },
  });
}
