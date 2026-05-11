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

/**
 * Xin quyền đọc bước chân và nhịp tim từ Apple Health / Health Connect.
 * Không hiển thị toast khi thành công (caller tự báo sau khi lưu prefs).
 */
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
  } catch (error: any) {
    console.error('[healthIntegration]', error);
    if (error?.message?.includes?.('denied')) {
      toast.error('Quyền đọc sức khỏe bị từ chối. Kiểm tra Cài đặt → Quyền riêng tư.');
    } else {
      toast.error('Không kết nối được Apple Health / Health Connect.');
    }
    return false;
  }
}

export const HEALTH_PREFS_CHANGED = 'digiwell-health-prefs-changed';
