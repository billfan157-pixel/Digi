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

function mapWeatherData(data: any): WeatherData {
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
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn("OpenWeatherMap API key is missing. Please set VITE_OPENWEATHER_API_KEY.");
      return null;
    }

    const query = lookup.coords
      ? `lat=${lookup.coords.latitude}&lon=${lookup.coords.longitude}`
      : lookup.city
        ? `q=${encodeURIComponent(lookup.city)}`
        : '';

    if (!query) {
      throw new Error('Missing location input for weather lookup.');
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${query}&units=metric&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }

    const data = await response.json();
    return mapWeatherData(data);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};

export const calculateWeatherAdjustment = (baseGoal: number, temp: number, humidity: number): number => {
  const tempMultiplier = temp > 25 ? (temp - 25) * 0.01 : 0;
  const humidityMultiplier = humidity > 70 ? 0.05 : 0;
  
  const adjustedGoal = baseGoal * (1 + tempMultiplier + humidityMultiplier);
  
  // Return the additional amount added by the weather
  return Math.round(adjustedGoal - baseGoal);
};
