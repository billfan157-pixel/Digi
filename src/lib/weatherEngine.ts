import { Capacitor } from '@capacitor/core';
import { calculateWeatherBandAdjustment } from './HydrationEngine';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  status?: string;
  location?: string;
}

type WeatherLookup = {
  city?: string;
  coords?: {
    latitude: number;
    longitude: number;
  };
};

interface WeatherApiResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather?: Array<{
    description?: string;
    main?: string;
  }>;
  name?: string;
}

function mapWeatherData(data: WeatherApiResponse): WeatherData {
  return {
    temp: data.main.temp,
    feels_like: data.main.feels_like,
    humidity: data.main.humidity,
    status: data.weather?.[0]?.description || data.weather?.[0]?.main || '',
    location: data.name || '',
  };
}

export const getWeatherData = async (lookup: WeatherLookup): Promise<WeatherData | null> => {
  try {
    // navigator.onLine is unreliable in Capacitor WebView — skip on native
    const isNative = Capacitor.isNativePlatform();
    if (!isNative && typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('[Weather] Offline — skipping fetch');
      return null;
    }

    const body = {
      lat: lookup.coords?.latitude,
      lon: lookup.coords?.longitude,
      city: lookup.city,
    };
    console.log('[WeatherEngine] Fetching weather-proxy with body:', body, 'native:', isNative);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/weather-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });

    console.log('[WeatherEngine] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('[WeatherEngine] HTTP error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[WeatherEngine] Weather proxy response:', data);
    return mapWeatherData(data as WeatherApiResponse);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null;
    console.error('[WeatherEngine] Error fetching weather data:', error);
    return null;
  }
};

export const calculateWeatherAdjustment = (baseGoal: number, temp: number, humidity: number): number => {
  const cappedAdjustment = Math.min(calculateWeatherBandAdjustment(temp, humidity), 500);
  return Math.min(cappedAdjustment, Math.max(0, baseGoal));
};
