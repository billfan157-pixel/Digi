// src/hooks/useWeatherSync.ts
import { Geolocation } from '@capacitor/geolocation';
import { getWeatherData, calculateWeatherAdjustment, type WeatherData } from '@/lib/weatherEngine';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../store/useAppStore';

const WEATHER_SYNC_TOAST_ID = 'weather-sync';
const WEATHER_SYNC_LOADING_DURATION = 4000;
const WEATHER_SYNC_RESULT_DURATION = 5000;
const WEATHER_SYNCED_KEY = 'digiwell_weather_synced_flag';

// Hàm logic chính
export const syncWeatherAndWaterGoal = async () => {
  try {
    toast.loading('Đang kiểm tra quyền vị trí...', {
      id: WEATHER_SYNC_TOAST_ID,
      duration: WEATHER_SYNC_LOADING_DURATION,
    });

    const isNative = Capacitor.isNativePlatform();
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (!isNative) {
      if (!navigator.geolocation) {
        toast.error('Trình duyệt không hỗ trợ định vị.', {
          id: WEATHER_SYNC_TOAST_ID,
          duration: WEATHER_SYNC_RESULT_DURATION,
        });
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
        toast.error('Không thể lấy vị trí.', {
          id: WEATHER_SYNC_TOAST_ID,
          duration: WEATHER_SYNC_RESULT_DURATION,
        });
        return false;
      }
    } else {
      try {
        const permStatus = await Geolocation.checkPermissions();
        if (permStatus.location !== 'granted') {
          const request = await Geolocation.requestPermissions();
          if (request.location !== 'granted') {
            toast.error('Bạn đã từ chối cấp quyền vị trí.', {
              id: WEATHER_SYNC_TOAST_ID,
              duration: WEATHER_SYNC_RESULT_DURATION,
            });
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
        toast.error('Không thể lấy vị trí.', {
          id: WEATHER_SYNC_TOAST_ID,
          duration: WEATHER_SYNC_RESULT_DURATION,
        });
        return false;
      }
    }

    if (latitude === null || longitude === null) return false;
    
    toast.loading('Đang lấy dữ liệu thời tiết...', {
      id: WEATHER_SYNC_TOAST_ID,
      duration: WEATHER_SYNC_LOADING_DURATION,
    });

    const weather = await getWeatherData({ coords: { latitude, longitude } });
    if (!weather) {
      toast.error('Không thể lấy dữ liệu thời tiết.', {
        id: WEATHER_SYNC_TOAST_ID,
        duration: WEATHER_SYNC_RESULT_DURATION,
      });
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    const { data: profile } = await supabase
      .from('profiles')
      .select('water_goal')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const baseGoal = profile.water_goal || 2000;
    const adjustment = calculateWeatherAdjustment(baseGoal, weather.temp, weather.humidity);
    const newGoal = baseGoal + adjustment;

    if (Math.abs(adjustment) > 50) {
      const { error } = await supabase
        .from('profiles')
        .update({ water_goal: newGoal })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`Đã cập nhật mục tiêu nước theo thời tiết (${Math.round(weather.temp)}°C)`, { id: WEATHER_SYNC_TOAST_ID, duration: 6000 });
    } else {
      toast.info(`Thời tiết ôn hòa, không cần điều chỉnh mục tiêu.`, {
        id: WEATHER_SYNC_TOAST_ID,
        duration: WEATHER_SYNC_RESULT_DURATION,
      });
    }
    
    return weather;

  } catch (error: any) {
    toast.error('Lỗi: ' + (error.message || 'Không xác định'), {
      id: WEATHER_SYNC_TOAST_ID,
      duration: WEATHER_SYNC_RESULT_DURATION,
    });
    return false;
  }
};

// React Hook wrapper
export function useWeatherSync() {
  const isWeatherSynced = useAppStore(s => s.isWeatherSynced);
  const weatherData = useAppStore(s => s.weatherData);
  const setAppState = useAppStore(s => s.setAppState);

  const setIsWeatherSynced = useCallback((synced: boolean) => {
    setAppState({ isWeatherSynced: synced });
    localStorage.setItem(WEATHER_SYNCED_KEY, synced ? 'true' : 'false');
  }, [setAppState]);

  const syncWeather = useCallback(async () => {
    const weather = await syncWeatherAndWaterGoal();
    if (weather) {
      setAppState({ 
        isWeatherSynced: true,
        weatherData: weather as any
      });
      localStorage.setItem(WEATHER_SYNCED_KEY, 'true');
      return true;
    }
    return false;
  }, [setAppState]);

  return {
    isWeatherSynced,
    setIsWeatherSynced,
    weatherData,
    syncWeather,
  };
}
