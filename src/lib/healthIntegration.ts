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
    toast.info('Đồng bộ Apple Health / Health Connect chỉ dùng trên app iOS hoặc Android.');
    return false;
  }

  try {
    const availRes = await Health.isAvailable();
    if (!coerceAvailable(availRes)) {
      toast.error('Dịch vụ sức khỏe không khả dụng trên thiết bị này.');
      return false;
    }

    const status = await Health.requestAuthorization({
      read: ['steps' as HealthDataType, 'heartRate' as HealthDataType],
    });

    const readAuthorized = (status as { readAuthorized?: HealthDataType[] }).readAuthorized;
    const stepsAllowed =
      !Array.isArray(readAuthorized) || readAuthorized.includes('steps' as HealthDataType);

    if (!stepsAllowed) {
      toast.error('Bạn chưa cấp quyền đọc số bước trong ứng dụng Sức khỏe.');
      return false;
    }

    return true;
  } catch (error: unknown) {
    console.error('[healthIntegration]', error);
    if (error instanceof Error && error.message?.includes?.('denied')) {
      toast.error('Quyền đọc sức khỏe bị từ chối. Kiểm tra Cài đặt → Quyền riêng tư.');
    } else {
      toast.error('Không kết nối được Apple Health / Health Connect.');
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
