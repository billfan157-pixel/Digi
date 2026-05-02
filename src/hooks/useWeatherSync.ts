// src/hooks/useWeatherSync.ts
import { Geolocation } from '@capacitor/geolocation';
import { getWeatherData, calculateWeatherAdjustment } from '@/lib/weatherEngine';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const syncWeatherAndWaterGoal = async () => {
  try {
    toast.loading('Đang định vị vị trí của bạn...');

    // 1. Lấy vị trí hiện tại
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true, // Dùng GPS chính xác nhất
      timeout: 10000,
    });

    const { latitude, longitude } = coordinates.coords;
    console.log('📍 Vị trí tìm thấy:', latitude, longitude);

    // 2. Gọi Weather Engine lấy dữ liệu thời tiết
    const weather = await getWeatherData({
      coords: { latitude, longitude }
    });

    if (!weather) {
      toast.error('Không thể lấy dữ liệu thời tiết. Vui lòng thử lại.');
      return;
    }

    console.log('🌤️ Thời tiết:', weather);

    // 3. Lấy thông tin user hiện tại để tính goal cơ bản
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    const { data: profile } = await supabase
      .from('profiles')
      .select('water_goal')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const baseGoal = profile.water_goal || 2000;
    
    // 4. Tính toán điều chỉnh dựa trên thời tiết
    const adjustment = calculateWeatherAdjustment(baseGoal, weather.temp, weather.humidity);
    const newGoal = baseGoal + adjustment;

    // 5. Cập nhật lại database nếu có thay đổi đáng kể (>50ml)
    if (Math.abs(adjustment) > 50) {
      const { error } = await supabase
        .from('profiles')
        .update({ water_goal: newGoal })
        .eq('id', user.id);

      if (error) throw error;

      let message = `Thời tiết tại ${weather.location || 'khu vực của bạn'}: ${Math.round(weather.temp)}°C, độ ẩm ${weather.humidity}%.\n`;
      if (adjustment > 0) {
        message += `Trời nóng/ẩm, DigiWell đã tăng mục tiêu thêm ${adjustment}ml 💧`;
      } else {
        message += `Trời mát, mục tiêu giữ nguyên hoặc giảm nhẹ.`;
      }
      
      toast.success(message, { duration: 5000 });
    } else {
      toast.info(`Thời tiết ôn hòa, không cần điều chỉnh lượng nước.`);
    }

  } catch (error: any) {
    console.error('Lỗi đồng bộ thời tiết:', error);
    
    if (error.message?.includes('permission')) {
      toast.error('Bạn đã từ chối cấp quyền vị trí. Vui lòng vào Cài đặt > DigiWell để bật.');
    } else if (error.message?.includes('timeout')) {
      toast.error('Không thể xác định vị trí. Hãy thử lại ở nơi thoáng đãng hơn.');
    } else {
      toast.error('Lỗi: ' + (error.message || 'Không xác định'));
    }
  }
};
// ... (Toàn bộ code cũ giữ nguyên) ...

// ==========================================
// THÊM PHẦN NÀY VÀO CUỐI FILE ĐỂ SỬA LỖI
// ==========================================
import { useState, useCallback } from 'react';
import type { WeatherData } from '@/lib/weatherEngine';

// Tạo một React Hook wrapper để tương thích với useAppSystem
export function useWeatherSync() {
  const [isWeatherSynced, setIsWeatherSynced] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const syncWeather = useCallback(async () => {
    // Gọi hàm logic chính đã có sẵn
    await syncWeatherAndWaterGoal();
    // Cập nhật trạng thái local (có thể mở rộng sau)
    setIsWeatherSynced(true); 
    return true;
  }, []);

  return {
    isWeatherSynced,
    setIsWeatherSynced,
    weatherData,
    syncWeather,
  };
}