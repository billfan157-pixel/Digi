// src/hooks/useWeatherSync.ts
import { Geolocation } from '@capacitor/geolocation';
import { getWeatherData, calculateWeatherAdjustment, type WeatherData } from '@/lib/weatherEngine';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../store/useAppStore';
import { AppStorage } from '@/lib/storage';

const WEATHER_SYNC_TOAST_ID = 'weather-sync';
const WEATHER_SYNC_LOADING_DURATION = 4000;
const WEATHER_SYNC_RESULT_DURATION = 5000;
const WEATHER_SYNCED_KEY = 'digiwell_weather_synced_flag';
const WEATHER_DATA_KEY = 'digiwell_weather_data';

export function weatherToStoreData(w: WeatherData) {
  return {
    temp: w.temp,
    humidity: w.humidity,
    feelsLike: w.feels_like,
    status: w.status,
    location: w.location,
  };
}

async function getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  const isNative = Capacitor.isNativePlatform();

  if (!isNative) {
    if (!navigator.geolocation) return null;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch {
      return null;
    }
  }

  try {
    const permStatus = await Geolocation.checkPermissions();
    if (permStatus.location !== 'granted') {
      const request = await Geolocation.requestPermissions();
      if (request.location !== 'granted') return null;
    }
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    });
    return { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
  } catch {
    return null;
  }
}

export const syncWeatherAndWaterGoal = async (silent = false): Promise<WeatherData | false> => {
  const toastId = silent ? undefined : WEATHER_SYNC_TOAST_ID;
  const showError = (msg: string) => { if (!silent) toast.error(msg, { id: toastId, duration: WEATHER_SYNC_RESULT_DURATION }); };

  try {
    if (!silent) {
      toast.loading('Đang kiểm tra quyền vị trí...', { id: toastId, duration: WEATHER_SYNC_LOADING_DURATION });
    }

    const coords = await getCurrentPosition();
    if (!coords) {
      showError('Không thể lấy vị trí.');
      return false;
    }

    if (!silent) {
      toast.loading('Đang lấy dữ liệu thời tiết...', { id: toastId, duration: WEATHER_SYNC_LOADING_DURATION });
    }

    const weather = await getWeatherData({ coords });
    if (!weather) {
      showError('Không thể lấy dữ liệu thời tiết.');
      return false;
    }

    if (!silent) {
      toast.loading('Đang cập nhật mục tiêu nước...', { id: toastId, duration: WEATHER_SYNC_LOADING_DURATION });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (!silent) toast.info('Chưa đăng nhập, chỉ cập nhật hiển thị thời tiết.', { id: toastId, duration: WEATHER_SYNC_RESULT_DURATION });
      return weather;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('water_goal')
      .eq('id', user.id)
      .single();

    if (profile) {
      const baseGoal = profile.water_goal || 2000;
      const adjustment = calculateWeatherAdjustment(baseGoal, weather.temp, weather.humidity);
      const newGoal = baseGoal + adjustment;

      if (Math.abs(adjustment) > 50) {
        const { error } = await supabase
          .from('profiles')
          .update({ water_goal: newGoal })
          .eq('id', user.id);

        if (error) throw error;
        if (!silent) {
          toast.success(`Đã cập nhật mục tiêu nước theo thời tiết (${Math.round(weather.temp)}°C)`, { id: toastId, duration: 6000 });
        }
      } else {
        if (!silent) {
          toast.info(`Thời tiết ôn hòa, không cần điều chỉnh mục tiêu.`, { id: toastId, duration: WEATHER_SYNC_RESULT_DURATION });
        }
      }
    }

    return weather;
  } catch (error: unknown) {
    showError('Lỗi: ' + (error instanceof Error ? error.message : 'Không xác định'));
    return false;
  }
};

function persistWeatherSyncFlag(synced: boolean) {
  AppStorage.setItem(WEATHER_SYNCED_KEY, synced ? 'true' : 'false');
}

function persistWeatherData(data: WeatherData | null) {
  if (data) {
    AppStorage.setItem(WEATHER_DATA_KEY, JSON.stringify(data));
  } else {
    AppStorage.removeItem(WEATHER_DATA_KEY);
  }
}

function restoreWeatherData(): WeatherData | null {
  try {
    const raw = AppStorage.getItem(WEATHER_DATA_KEY);
    return raw ? (JSON.parse(raw) as WeatherData) : null;
  } catch {
    return null;
  }
}

export function useWeatherSync() {
  const isWeatherSynced = useAppStore(s => s.isWeatherSynced);
  const weatherData = useAppStore(s => s.weatherData);
  const setAppState = useAppStore(s => s.setAppState);
  const inFlightRef = useRef(false);
  const initializedRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const restored = restoreWeatherData();
    const flag = AppStorage.getItem(WEATHER_SYNCED_KEY) === 'true';
    if (restored && flag) {
      setAppState({
        weatherData: weatherToStoreData(restored),
        isWeatherSynced: true,
      });
    }
  }, [setAppState]);

  const setIsWeatherSynced = useCallback((synced: boolean) => {
    setAppState({ isWeatherSynced: synced });
    persistWeatherSyncFlag(synced);
  }, [setAppState]);

  const syncWeather = useCallback(async () => {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    setIsSyncing(true);
    try {
      const weather = await syncWeatherAndWaterGoal();
      if (weather) {
        setAppState({ 
          isWeatherSynced: true,
          weatherData: weatherToStoreData(weather),
        });
        persistWeatherSyncFlag(true);
        persistWeatherData(weather);
        return true;
      }
      return false;
    } finally {
      inFlightRef.current = false;
      setIsSyncing(false);
    }
  }, [setAppState]);

  return {
    isWeatherSynced,
    setIsWeatherSynced,
    weatherData,
    syncWeather,
    isSyncing,
  };
}
