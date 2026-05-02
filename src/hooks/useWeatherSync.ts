import { useState } from 'react';
import { toast } from 'sonner';
import { getWeatherData, type WeatherData } from '../lib/weatherEngine';

type WeatherSyncOptions = {
  useCurrentLocation?: boolean;
};

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Thiết bị không hỗ trợ định vị.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 10 * 60 * 1000,
    });
  });
}

export function useWeatherSync() {
  const [isWeatherSynced, setIsWeatherSynced] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const syncWeather = async (city?: string, options: WeatherSyncOptions = {}) => {
    const { useCurrentLocation = false } = options;
    const tid = toast.loading("Đang đồng bộ trạm thời tiết...");

    try {
      let data: WeatherData | null = null;
      let locationLabel = city?.trim() || '';

      if (useCurrentLocation) {
        const position = await getCurrentPosition();
        data = await getWeatherData({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
        locationLabel = data?.location || 'vị trí hiện tại';
      } else if (city?.trim()) {
        data = await getWeatherData({ city: city.trim() });
        locationLabel = city.trim();
      } else {
        throw new Error("Chưa có vị trí hoặc thành phố để lấy dữ liệu thời tiết.");
      }

      if (!data) throw new Error("Không nhận được dữ liệu thời tiết.");

      setWeatherData(data);
      setIsWeatherSynced(true);
      toast.success(`Thời tiết tại ${locationLabel} đã cập nhật: ${data.temp}°C`, { id: tid });
    } catch (err) {
      setIsWeatherSynced(false);
      setWeatherData(null);
      const message = err instanceof Error ? err.message : "Không thể kết nối trạm thời tiết!";
      toast.error(message, { id: tid });
    }
  };

  return { isWeatherSynced, setIsWeatherSynced, weatherData, syncWeather };
}
