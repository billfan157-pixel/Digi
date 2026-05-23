import { calculateWeatherBandAdjustment } from './HydrationEngine';
import { supabase } from './supabase';

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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('[Weather] Offline — skipping fetch');
      return null;
    }

    const { data, error } = await supabase.functions.invoke('weather-proxy', {
      body: {
        lat: lookup.coords?.latitude,
        lon: lookup.coords?.longitude,
        city: lookup.city,
      },
    });

    if (error) {
      console.error('Weather proxy error:', error);
      return null;
    }

    if (!data) {
      console.warn('Weather proxy returned no data');
      return null;
    }

    return mapWeatherData(data as WeatherApiResponse);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null;
    console.error("Error fetching weather data:", error);
    return null;
  }
};

export const calculateWeatherAdjustment = (baseGoal: number, temp: number, humidity: number): number => {
  const cappedAdjustment = Math.min(calculateWeatherBandAdjustment(temp, humidity), 500);
  return Math.min(cappedAdjustment, Math.max(0, baseGoal));
};
