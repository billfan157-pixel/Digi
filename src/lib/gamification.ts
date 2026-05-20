import { supabase } from './supabase';

/**
 * Gọi Supabase RPC để ghi nhận lượng nước và tính toán Gamification an toàn trên Server.
 */
export async function logWaterAndUpdateStreakSecurely(
  userId: string, 
  mlAdded: number, 
  name: string = 'Nước lọc',
  factors: { tempC?: number; exerciseMins?: number; isFasting?: boolean } = {}
) {
  
  // 🛑 CHỐT CHẶN BÊ TÔNG: Block ID giả (ngắn hơn 30 ký tự)
  if (String(userId).length < 30) {
    console.warn(`🛡️ Gamification: ID "${userId}" là ID giả. Trả về data ảo, KHÔNG gọi Supabase!`);
    // Trả về một object giả lập y hệt cấu trúc DB để UI vẫn hoạt động mượt mà
    return {
      success: true,
      log_id: `mock-log-${Date.now()}`,
      current_streak: 1, 
      wp: 10,            
      streak_freezes: 0  
    };
  }

  // ✅ ĐÃ FIX TÊN BIẾN (Thêm p_): TIẾN HÀNH GỌI API CHO USER THẬT
  const { data, error } = await supabase.rpc('log_water_and_update_streak', {
    p_user_id: userId,
    p_ml_added: mlAdded,
    p_name: name,
    p_temp_c: factors.tempC || null,
    p_exercise_mins: factors.exerciseMins || 0,
    p_is_fasting: factors.isFasting || false
  });

  if (error) {
    console.error('Lỗi khi gọi RPC Gamification:', error);
    throw error;
  }

  return data;
}

export async function fetchStreakFreezes(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('streak_freezes')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data?.streak_freezes || 0;
}

export async function applyStreakFreeze(userId: string): Promise<{ remaining_freezes: number } | null> {
  const { data, error } = await supabase.rpc('use_streak_freeze', { p_user_id: userId });
  if (error) throw error;
  return data;
}