import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  sendPushNotification,
  subscriptionToRow,
  urlBase64ToUint8Array,
} from './pushNotification';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

const invokeMock = vi.mocked(supabase.functions.invoke);

beforeEach(() => {
  invokeMock.mockReset();
});

describe('urlBase64ToUint8Array', () => {
  it('decodes URL-safe base64 into an ArrayBuffer', () => {
    const buffer = urlBase64ToUint8Array('SGVsbG8td29ybGQ');
    const decoded = new TextDecoder().decode(buffer);

    expect(decoded).toBe('Hello-world');
  });
});

describe('subscriptionToRow', () => {
  it('maps browser subscription JSON keys to a database row', () => {
    const sub = {
      endpoint: 'https://push.example/sub-1',
      toJSON: () => ({
        endpoint: 'https://push.example/sub-1',
        keys: {
          p256dh: 'p-key',
          auth: 'auth-key',
        },
      }),
    } as PushSubscription;

    expect(subscriptionToRow('user-1', sub, 'Chrome')).toEqual({
      user_id: 'user-1',
      endpoint: 'https://push.example/sub-1',
      p256dh: 'p-key',
      auth: 'auth-key',
      device_name: 'Chrome',
    });
  });

  it('throws when browser subscription keys are missing', () => {
    const sub = {
      endpoint: 'https://push.example/sub-1',
      toJSON: () => ({ endpoint: 'https://push.example/sub-1', keys: {} }),
    } as PushSubscription;

    expect(() => subscriptionToRow('user-1', sub, 'Chrome')).toThrow('Push subscription missing encryption keys');
  });
});

describe('sendPushNotification', () => {
  it('invokes the Supabase push edge function with a normalized payload', async () => {
    invokeMock.mockResolvedValue({ data: { sent: 1, total: 1 }, error: null });

    const result = await sendPushNotification({
      title: 'DigiWell',
      body: 'Uống nước thôi',
      data: { type: 'hydration_test' },
    });

    expect(invokeMock).toHaveBeenCalledWith('send-push-notification', {
      body: {
        title: 'DigiWell',
        body: 'Uống nước thôi',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { type: 'hydration_test' },
      },
    });
    expect(result).toEqual({ sent: 1, total: 1, message: undefined });
  });

  it('throws when Supabase function invocation fails', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'Unauthorized' } });

    await expect(sendPushNotification({ title: 'DigiWell', body: 'Test' }))
      .rejects.toThrow('Unauthorized');
  });
});
