// src/hooks/useWeatherSync.ts
import { Geolocation } from '@capacitor/geolocation';
import { getWeatherData, calculateWeatherAdjustment, type WeatherData } from '@/lib/weatherEngine';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Hàm logic chính (Đã tối ưu cho iOS thật)
export const syncWeatherAndWaterGoal = async () => {
  try {
    toast.loading('📡 Đang kiểm tra quyền vị trí...', { duration: 2000 });

    // 0. Kiểm tra và yêu cầu permission trước (quan trọng cho web)
    const isNative = Capacitor.isNativePlatform();
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (!isNative) {
      // Trên web, dùng Web Geolocation API
      if (!navigator.geolocation) {
        toast.error('Trình duyệt không hỗ trợ định vị. Vui lòng dùng ứng dụng di động.');
        return false;
      }
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (geoError: any) {
        const errCode = geoError.code || geoError.PERMISSION_DENIED;
        if (errCode === 1 || errCode === geoError.PERMISSION_DENIED) {
          toast.error('Bạn đã từ chối cấp quyền vị trí. Vui lòng cho phép truy cập vị trí trong trình duyệt.');
        } else if (errCode === 3 || errCode === geoError.TIMEOUT) {
          toast.error('Hết thời gian định vị. Hãy thử lại ở nơi có GPS tốt hơn.');
        } else {
          toast.error('Không thể lấy vị trí: ' + (geoError.message || 'Lỗi không xác định'));
        }
        return false;
      }
    } else {
      // Trên native (iOS/Android), kiểm tra permission
      try {
        const permStatus = await Geolocation.checkPermissions();
        if (permStatus.location !== 'granted') {
          const request = await Geolocation.requestPermissions();
          if (request.location !== 'granted') {
            toast.error('Bạn đã từ chối cấp quyền vị trí. Vào Cài đặt > DigiWell > Vị trí để cho phép.');
            return false;
          }
        }

        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        });
        latitude = coordinates.coords.latitude;
        longitude = coordinates.coords.longitude;
      } catch (nativeError: any) {
        console.error('❌ Lỗi native geolocation:', nativeError);
        toast.error('Không thể lấy vị trí: ' + (nativeError.message || 'Lỗi không xác định'));
        return false;
      }
    }

    if (latitude === null || longitude === null) {
      toast.error('Không lấy được tọa độ vị trí.');
      return false;
    }
    
    console.log('📍 Vị trí tìm thấy:', latitude, longitude);

    toast.loading('🌤️ Đang lấy dữ liệu thời tiết...', { duration: 2000 });

    // 2. Gọi Weather Engine lấy dữ liệu thời tiết
    const weather = await getWeatherData({
      coords: { latitude, longitude }
    });

    if (!weather) {
      toast.error('Không thể lấy dữ liệu thời tiết. Vui lòng thử lại.');
      return false;
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
        message += `Trời mát, mục tiêu giữ nguyên.`;
      }
      
      toast.success(message, { duration: 6000 });
    } else {
      toast.info(`Thời tiết ôn hòa (${Math.round(weather.temp)}°C), không cần điều chỉnh lượng nước.`);
    }
    
    return true;

  } catch (error: any) {
    console.error('❌ Lỗi đồng bộ thời tiết chi tiết:', error);
    
    // Xử lý các lỗi đặc thù của iOS
    if (error.message?.includes('permission') || error.code === 'UNAVAILABLE') {
      toast.error('Bạn đã từ chối cấp quyền vị trí. Vui lòng vào Cài đặt > DigiWell > Vị trí > Chọn "Khi dùng ứng dụng".', { duration: 8000 });
    } else if (error.message?.includes('timeout')) {
      toast.error('Hết thời gian chờ định vị. Hãy thử lại ở nơi thoáng đãng hơn hoặc bật GPS.', { duration: 6000 });
    } else if (error.message?.includes('network')) {
      toast.error('Lỗi kết nối mạng khi lấy thời tiết.');
    } else {
      toast.error('Lỗi: ' + (error.message || 'Không xác định'));
    }
    return false;
  }
};

// React Hook wrapper để tương thích với useAppSystem
export function useWeatherSync() {
  const [isWeatherSynced, setIsWeatherSynced] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const syncWeather = useCallback(async () => {
    const success = await syncWeatherAndWaterGoal();
    if (success) {
      setIsWeatherSynced(true);
      // Có thể cập nhật weatherData ở đây nếu cần
    }
    return success;
  }, []);

  return {
    isWeatherSynced,
    setIsWeatherSynced,
    weatherData,
    syncWeather,
  };
}