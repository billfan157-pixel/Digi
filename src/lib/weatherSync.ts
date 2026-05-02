// src/lib/weatherSync.ts
import { Geolocation } from '@capacitor/geolocation';
import { getWeatherData, calculateWeatherAdjustment } from './weatherEngine'; // Import engine của bạn
import { supabase } from './supabase';
import { toast } from 'sonner';

export const syncWeatherAndWaterGoal = async (userId: string) => {
  try {
    toast.loading('Đang định vị và cập nhật thời tiết...');

    // 1. Lấy vị trí hiện tại từ thiết bị
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true, // Dùng GPS chính xác nhất
      timeout: 10000,
    });

    const { latitude, longitude } = coordinates.coords;
    console.log('📍 Đã lấy vị trí:', latitude, longitude);

    // 2. Gọi Weather Engine của bạn để lấy dữ liệu
    const weather = await getWeatherData({
      coords: { latitude, longitude }
    });

    if (!weather) {
      toast.error('Không thể lấy dữ liệu thời tiết. Vui lòng thử lại.');
      return;
    }

    console.log('🌤️ Thời tiết hiện tại:', weather);

    // 3. Lấy mục tiêu nước hiện tại từ Profile (hoặc dùng mức mặc định 2000ml)
    // Ở đây ta giả sử baseGoal là 2000ml, hoặc bạn có thể fetch từ DB trước đó
    const BASE_GOAL = 2000; 
    
    // 4. Tính toán lượng nước điều chỉnh
    const additionalWater = calculateWeatherAdjustment(BASE_GOAL, weather.temp, weather.humidity);
    const newGoal = BASE_GOAL + additionalWater;

    // 5. Cập nhật lên Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ 
        water_goal: newGoal,
        // Bạn có thể lưu thêm thông tin thời tiết vào profile nếu muốn
        // climate: `${weather.status}, ${Math.round(weather.temp)}°C` 
      })
      .eq('id', userId);

    if (error) throw error;

    // 6. Thông báo thành công
    toast.success(
      `Thời tiết tại ${weather.location || 'khu vực của bạn'}: ${weather.status} (${Math.round(weather.temp)}°C). \nMục tiêu nước đã điều chỉnh thành ${newGoal}ml 💧`
    );

    return newGoal;

  } catch (err: any) {
    console.error('❌ Lỗi đồng bộ thời tiết:', err);
    
    // Xử lý các lỗi cụ thể
    if (err.message?.includes('permission') || err.code === 'UNAVAILABLE') {
      toast.error('Bạn chưa cấp quyền vị trí. Vui lòng vào Cài đặt > DigiWell > Vị trí để bật.');
    } else {
      toast.error('Lỗi: ' + (err.message || 'Không xác định'));
    }
    
    return null;
  }
};