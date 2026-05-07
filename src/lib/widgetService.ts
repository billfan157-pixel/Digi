import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Interface dữ liệu gửi sang Native
interface WidgetDataPayload {
  partnerName: string;
  partnerAvatar: string | null;
  progressPercent: number; // 0 - 100
  isCompleted: boolean;
  lastUpdated: string;
}

/**
 * Cập nhật dữ liệu Widget cho một user cụ thể.
 * Gọi hàm này mỗi khi có sự kiện uống nước hoặc hoàn thành mục tiêu.
 */
export async function updateWidgetCache(userId: string) {
  try {
    // 1. Tìm "Partner" quan trọng nhất của user này
    // Logic ưu tiên: Người có cùng Club & đang dẫn đầu, hoặc người bạn tương tác nhiều nhất.
    // Ở đây ta lấy ngẫu nhiên 1 người trong cùng club chưa hoàn thành mục tiêu để tạo áp lực :))
    const { data: partnerData } = await supabase
      .from('profiles')
      .select(`
        id, nickname, avatar_url, water_today, water_goal
      `)
      .neq('id', userId) // Không lấy chính mình
      .order('water_today', { ascending: false }) // Lấy người uống nhiều nhất để "lườm"
      .limit(1)
      .single();

    if (!partnerData) {
      console.log('[Widget] Chưa tìm thấy Partner phù hợp.');
      return;
    }

    const progress = partnerData.water_goal > 0 
      ? Math.min(100, Math.round((partnerData.water_today / partnerData.water_goal) * 100)) 
      : 0;
    
    const isCompleted = progress >= 100;

    // 2. Ghi vào bảng Cache trên Supabase (Dành cho trường hợp cần đồng bộ đám mây)
    await supabase.from('widget_cache').upsert({
      user_id: userId,
      partner_id: partnerData.id,
      partner_name: partnerData.nickname || 'Bạn bè',
      partner_avatar_url: partnerData.avatar_url,
      partner_water_today: partnerData.water_today,
      partner_water_goal: partnerData.water_goal,
      partner_progress_percent: progress,
      is_partner_goal_completed: isCompleted,
      last_updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // 3. QUAN TRỌNG NHẤT: Ghi file JSON Local để iOS Widget đọc được (Không cần mạng)
    if (Capacitor.isNativePlatform()) {
      const payload: WidgetDataPayload = {
        partnerName: partnerData.nickname || 'Đối thủ',
        partnerAvatar: partnerData.avatar_url || '',
        progressPercent: progress,
        isCompleted: isCompleted,
        lastUpdated: new Date().toISOString()
      };

      // Ghi file vào thư mục Documents (Nơi WidgetKit có thể đọc)
      await Filesystem.writeFile({
        path: 'digiwell_widget_data.json',
        data: JSON.stringify(payload),
        directory: Directory.Documents,
      });
      
      console.log('[Widget] Đã cập nhật file local cho iOS.');
    }

  } catch (error) {
    console.error('[Widget] Lỗi cập nhật cache:', error);
  }
}

/**
 * Hàm tiện ích: Mở chia sẻ để hướng dẫn user add widget (Optional)
 */
export async function showAddWidgetGuide() {
  // Có thể mở một modal hướng dẫn hoặc share ảnh hướng dẫn
  alert("Để thêm Widget DigiWell:\n1. Giữ ngón tay vào màn hình chính.\n2. Bấm dấu '+' góc trái.\n3. Tìm 'DigiWell' và chọn kiểu 'Nhóm Nước'.");
}