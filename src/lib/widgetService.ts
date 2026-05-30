import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { registerPlugin } from '@capacitor/core';
import { getThemeConfigSync } from '@/services/theme.service';
import { readThemePreference } from '@/services/appPreferences.service';

interface WidgetPluginType {
  syncData: (data: { water_today: number; water_goal: number; themeColor: string }) => Promise<void>;
}

let WidgetPlugin: WidgetPluginType | null = null;
try {
  WidgetPlugin = registerPlugin<WidgetPluginType>('WidgetPlugin');
} catch {
  // Already registered
}

export { WidgetPlugin };

interface WidgetDataPayload {
  waterToday: number;
  waterGoal: number;
  themeColor: string;
  userProgressPercent: number;
  lastUpdated: string;
}

const WIDGET_PREFS_KEY = 'digiwell_widget_data';

function resolveThemeColor(userId: string, equippedThemeId?: string | null): string {
  if (equippedThemeId && equippedThemeId !== 'theme_default') {
    const themeConfig = getThemeConfigSync(equippedThemeId);
    return themeConfig.colors?.accent || '#06b6d4';
  }
  return readThemePreference(userId, '#06b6d4');
}

export interface UpdateWidgetCacheParams {
  userId: string;
  waterToday: number;
  waterGoal: number;
  equippedThemeId?: string | null;
}

export async function updateWidgetCache({
  userId,
  waterToday,
  waterGoal,
  equippedThemeId,
}: UpdateWidgetCacheParams) {
  try {
    const themeColor = resolveThemeColor(userId, equippedThemeId);
    const progress = waterGoal > 0
      ? Math.min(100, Math.round((waterToday / waterGoal) * 100))
      : 0;

    const payload: WidgetDataPayload = {
      waterToday: waterToday || 0,
      waterGoal: waterGoal || 2000,
      themeColor,
      userProgressPercent: progress,
      lastUpdated: new Date().toISOString(),
    };

    await Preferences.set({
      key: WIDGET_PREFS_KEY,
      value: JSON.stringify(payload),
    });

    if (Capacitor.isNativePlatform()) {
      try {
        await WidgetPlugin?.syncData({
          water_today: payload.waterToday,
          water_goal: payload.waterGoal,
          themeColor: payload.themeColor,
        });
        console.log(`[Widget] Đã đồng bộ cho platform: ${Capacitor.getPlatform()}`);
      } catch {
        console.log('[Widget] WidgetPlugin sync not available');
      }
    }
  } catch (error) {
    console.error('[Widget] Lỗi cập nhật cache:', error);
  }
}

export async function showAddWidgetGuide() {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') {
    alert("Để thêm Widget DigiWell:\n1. Giữ ngón tay vào màn hình chính cho đến khi icon rung.\n2. Bấm dấu '+' góc trái trên cùng.\n3. Tìm 'DigiWell' và chọn kiểu widget.");
  } else if (platform === 'android') {
    alert("Để thêm Widget DigiWell:\n1. Giữ ngón tay vào vùng trống trên màn hình chính.\n2. Chọn 'Widget' hoặc 'Tiện ích'.\n3. Tìm 'DigiWell' và kéo ra màn hình.");
  } else {
    alert("Widget chỉ hỗ trợ trên iOS và Android.");
  }
}
