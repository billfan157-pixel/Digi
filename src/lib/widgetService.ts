import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { registerPlugin } from '@capacitor/core';

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
  partnerName: string | null;
  partnerProgressPercent: number;
  lastUpdated: string;
}

const WIDGET_PREFS_KEY = 'digiwell_widget_data';

export async function updateWidgetCache(userId: string) {
  try {
    const { data: partnerData } = await supabase
      .from('profiles')
      .select(`id, nickname, avatar_url, water_today, water_goal`)
      .neq('id', userId)
      .order('water_today', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!partnerData) {
      console.log('[Widget] Chưa tìm thấy Partner phù hợp.');
      return;
    }

    const progress = partnerData.water_goal > 0
      ? Math.min(100, Math.round((partnerData.water_today / partnerData.water_goal) * 100))
      : 0;

    await supabase.from('widget_cache').upsert({
      user_id: userId,
      partner_id: partnerData.id,
      partner_name: partnerData.nickname || 'Bạn bè',
      partner_avatar_url: partnerData.avatar_url,
      partner_water_today: partnerData.water_today,
      partner_water_goal: partnerData.water_goal,
      partner_progress_percent: progress,
      is_partner_goal_completed: progress >= 100,
      last_updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (Capacitor.isNativePlatform()) {
      const payload: WidgetDataPayload = {
        waterToday: partnerData.water_today || 0,
        waterGoal: partnerData.water_goal || 2000,
        themeColor: '#06b6d4',
        partnerName: partnerData.nickname || null,
        partnerProgressPercent: progress,
        lastUpdated: new Date().toISOString()
      };

      await Preferences.set({
        key: WIDGET_PREFS_KEY,
        value: JSON.stringify(payload)
      });

      if (Capacitor.getPlatform() === 'ios') {
        try {
          await WidgetPlugin?.syncData({
            water_today: partnerData.water_today || 0,
            water_goal: partnerData.water_goal || 2000,
            themeColor: '#06b6d4'
          });
        } catch {
          console.log('[Widget] iOS WidgetPlugin sync not available');
        }
      }

      console.log(`[Widget] Đã đồng bộ cho platform: ${Capacitor.getPlatform()}`);
    }
  } catch (error) {
    console.error('[Widget] Lỗi cập nhật cache:', error);
  }
}

export async function showAddWidgetGuide() {
  alert("Để thêm Widget DigiWell:\n1. Giữ ngón tay vào màn hình chính.\n2. Bấm dấu '+' góc trái.\n3. Tìm 'DigiWell' và chọn kiểu 'Nhóm Nước'.");
}
