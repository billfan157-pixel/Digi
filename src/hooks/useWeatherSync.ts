import i18n from '@/i18n';
// src/hooks/useWeatherSync.ts
import { Geolocation } from '@capacitor/geolocation';
import { getWeatherData, type WeatherData } from '@/lib/weatherEngine';
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
const WEATHER_LAST_UPDATED_KEY = 'digiwell_weather_last_updated';
const WEATHER_LAST_ATTEMPT_KEY = 'digiwell_weather_last_attempt';
const WEATHER_LAST_STATUS_KEY = 'digiwell_weather_last_status';
const WEATHER_RETRY_ON_FAILURE_INTERVAL_MS = 60 * 1000; // 1 minute
const WEATHER_POLL_INTERVAL_MS = 15 * 60 * 1000;
const WEATHER_MAX_CALLS_PER_HOUR = 5;
const WEATHER_RATE_LIMIT_HOUR_MS = 60 * 60 * 1000;

type WeatherSyncOptions = {
  silent?: boolean;
  force?: boolean;
};

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
          timeout: 5000,
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
    console.log('[WeatherSync] Geolocation permission status:', permStatus);
    if (permStatus.location !== 'granted') {
      const request = await Geolocation.requestPermissions();
      console.log('[WeatherSync] Geolocation permission request result:', request);
      if (request.location !== 'granted') {
        console.warn('[WeatherSync] Geolocation permission denied');
        return null;
      }
    }
    console.log('[WeatherSync] Getting native position...');
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    });
    console.log('[WeatherSync] Native position result:', coordinates);
    return { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
  } catch (e) {
    console.error('[WeatherSync] Native geolocation error:', e);
    return null;
  }
}

export const syncWeatherAndWaterGoal = async (silent = false): Promise<WeatherData | false> => {
  const toastId = silent ? undefined : WEATHER_SYNC_TOAST_ID;
  const showError = (msg: string) => { if (!silent) toast.error(msg, { id: toastId, duration: WEATHER_SYNC_RESULT_DURATION }); };

  try {
    if (!silent) {
      toast.loading(i18n.t('weather.checking_location'), { id: toastId, duration: WEATHER_SYNC_LOADING_DURATION });
    }

    console.log('[WeatherSync] Getting current position...');
    const coords = await getCurrentPosition();
    console.log('[WeatherSync] Coords result:', coords);

    let weather: WeatherData | null = null;

    if (coords) {
      if (!silent) {
        toast.loading(i18n.t('weather.fetching'), { id: toastId, duration: WEATHER_SYNC_LOADING_DURATION });
      }
      console.log('[WeatherSync] Fetching weather with GPS coords');
      weather = await getWeatherData({ coords });
    } else {
      if (!silent) {
        toast.loading(i18n.t('weather.fallback_location'), { id: toastId, duration: WEATHER_SYNC_LOADING_DURATION });
      }
      console.log('[WeatherSync] GPS failed, falling back to IP-based lookup');
      // If GPS fails, call weather-proxy with empty lookup. Server will resolve location by IP.
      weather = await getWeatherData({});
    }

    console.log('[WeatherSync] Weather result:', weather);

    if (!weather) {
      showError(i18n.t('weather.update_failed'));
      return false;
    }

    if (!silent) {
      toast.success(i18n.t('weather.updated'), { id: toastId, duration: WEATHER_SYNC_RESULT_DURATION });
    }

    return weather;
  } catch (error: unknown) {
    console.error('[WeatherSync] Unexpected error:', error);
    showError(i18n.t('weather.update_failed') + ': ' + (error instanceof Error ? error.message : i18n.t('weather.unknown_error')));
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
  const lastAttemptAtRef = useRef(Number(AppStorage.getItem(WEATHER_LAST_ATTEMPT_KEY)) || 0);
  const [isSyncing, setIsSyncing] = useState(false);
  const rateLimitCountRef = useRef(0);
  const rateLimitWindowRef = useRef(Date.now());

  function checkRateLimit(): boolean {
    const now = Date.now();
    if (now - rateLimitWindowRef.current > WEATHER_RATE_LIMIT_HOUR_MS) {
      rateLimitCountRef.current = 0;
      rateLimitWindowRef.current = now;
    }
    if (rateLimitCountRef.current >= WEATHER_MAX_CALLS_PER_HOUR) {
      return false;
    }
    rateLimitCountRef.current += 1;
    return true;
  }

  // Restore cached data on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const restored = restoreWeatherData();
    const flag = AppStorage.getItem(WEATHER_SYNCED_KEY) === 'true';
    const lastUpdated = AppStorage.getItem(WEATHER_LAST_UPDATED_KEY) ?? null;
    if (restored && flag) {
      setAppState({
        weatherData: weatherToStoreData(restored),
        isWeatherSynced: true,
        weatherLastUpdatedAt: lastUpdated,
      });
    }
  }, [setAppState]);

  const setIsWeatherSynced = useCallback((synced: boolean) => {
    setAppState({ isWeatherSynced: synced });
    persistWeatherSyncFlag(synced);
  }, [setAppState]);

  const doSync = useCallback(async (options: WeatherSyncOptions = {}) => {
    if (inFlightRef.current) return false;
    if (!checkRateLimit()) {
      if (!options.silent) {
        toast.info(i18n.t('weather.rate_limit'), { id: WEATHER_SYNC_TOAST_ID, duration: WEATHER_SYNC_RESULT_DURATION });
      }
      return false;
    }
    const nowMs = Date.now();
    const lastStatus = AppStorage.getItem(WEATHER_LAST_STATUS_KEY);
    const isLastSuccess = lastStatus !== 'failure';
    const allowedInterval = isLastSuccess ? WEATHER_POLL_INTERVAL_MS : WEATHER_RETRY_ON_FAILURE_INTERVAL_MS;

    if (!options.force && nowMs - lastAttemptAtRef.current < allowedInterval) {
      if (!options.silent) {
        toast.info(i18n.t('weather.recently_updated'), { id: WEATHER_SYNC_TOAST_ID, duration: WEATHER_SYNC_RESULT_DURATION });
      }
      return false;
    }

    lastAttemptAtRef.current = nowMs;
    AppStorage.setItem(WEATHER_LAST_ATTEMPT_KEY, String(nowMs));
    inFlightRef.current = true;
    setIsSyncing(true);
    try {
      const weather = await syncWeatherAndWaterGoal(options.silent === true);
      if (weather) {
        const now = new Date().toISOString();
        setAppState({ 
          isWeatherSynced: true,
          weatherData: weatherToStoreData(weather),
          weatherLastUpdatedAt: now,
        });
        persistWeatherSyncFlag(true);
        persistWeatherData(weather);
        AppStorage.setItem(WEATHER_LAST_UPDATED_KEY, now);
        AppStorage.setItem(WEATHER_LAST_STATUS_KEY, 'success');
        return true;
      }
      AppStorage.setItem(WEATHER_LAST_STATUS_KEY, 'failure');
      return false;
    } finally {
      inFlightRef.current = false;
      setIsSyncing(false);
    }
  }, [setAppState]);

  // Polling interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      doSync({ silent: true });
    }, WEATHER_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [doSync]);

  // Refresh on tab focus
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        doSync({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [doSync]);

  return {
    isWeatherSynced,
    setIsWeatherSynced,
    weatherData,
    syncWeather: doSync,
    isSyncing,
  };
}
