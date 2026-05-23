import i18n from '@/i18n';
import { Capacitor } from '@capacitor/core';
import { Health, type HealthDataType } from '@capgo/capacitor-health';
import { toast } from 'sonner';

function coerceAvailable(raw: unknown): boolean {
  if (raw != null && typeof raw === 'object') {
    if ('available' in raw) return Boolean((raw as { available?: boolean }).available);
    if ('value' in raw) return Boolean((raw as { value?: boolean }).value);
  }
  return Boolean(raw);
}

export async function requestHealthReadStepsAndHeartRate(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    toast.info(i18n.t('health.app_only'));
    return false;
  }

  try {
    const availRes = await Health.isAvailable();
    if (!coerceAvailable(availRes)) {
      toast.error(i18n.t('health.service_unavailable'));
      return false;
    }

    const status = await Health.requestAuthorization({
      read: ['steps' as HealthDataType, 'heartRate' as HealthDataType],
    });

    const readAuthorized = (status as { readAuthorized?: HealthDataType[] }).readAuthorized;
    const stepsAllowed =
      !Array.isArray(readAuthorized) || readAuthorized.includes('steps' as HealthDataType);

    if (!stepsAllowed) {
      toast.error(i18n.t('health.steps_no_permission'));
      return false;
    }

    return true;
  } catch (error: unknown) {
    console.error('[healthIntegration]', error);
    if (error instanceof Error && error.message?.includes?.('denied')) {
      toast.error(i18n.t('health.health_permission_denied'));
    } else {
      toast.error(i18n.t('health.health_connect_failed'));
    }
    return false;
  }
}

export async function logWaterToHealth(amountMl: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const availRes = await Health.isAvailable();
    if (!coerceAvailable(availRes)) return;

    try {
      await Health.requestAuthorization({
        write: ['dietaryWater' as HealthDataType],
      });
    } catch {
      return;
    }

    try {
      await Health.saveSample({
        dataType: 'dietaryWater' as HealthDataType,
        value: amountMl,
        unit: 'ml' as never,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      });
    } catch (saveErr) {
      console.warn('[healthIntegration] saveSample dietaryWater failed:', saveErr);
    }
  } catch (err) {
    console.warn('[healthIntegration] logWaterToHealth error:', err);
  }
}
