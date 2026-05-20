/* eslint-disable @typescript-eslint/no-explicit-any */
export async function captureException(error: any, context?: any) {
  const dsn = Deno.env.get('SENTRY_DSN');
  if (!dsn) {
    console.warn('[Sentry] No DSN configured, skipping exception capture.');
    return;
  }

  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.substring(1);
    const host = url.host;
    const endpoint = `https://${host}/api/${projectId}/store/`;

    const eventId = crypto.randomUUID().replace(/-/g, '');
    const payload = {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      sdk: {
        name: 'digiwell-deno-sentry',
        version: '1.0.0',
      },
      exception: {
        values: [
          {
            type: error?.name || 'Error',
            value: error?.message || String(error),
            stacktrace: error?.stack ? {
              frames: error.stack.split('\n').map((line: string) => ({ instruction_addr: line.trim() })),
            } : undefined,
          },
        ],
      },
      extra: context || {},
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7,sentry_client=digiwell-deno-sentry/1.0.0,sentry_key=${publicKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[Sentry] Failed to send event:', await response.text());
    } else {
      console.log(`[Sentry] Event ${eventId} captured successfully.`);
    }
  } catch (err) {
    console.error('[Sentry] Error capturing exception in Sentry utility:', err);
  }
}
