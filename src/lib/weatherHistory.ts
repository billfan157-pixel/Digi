/**
 * Weather History Manager
 * Lưu/lấy lịch sử thời tiết 7 ngày gần nhất từ localStorage
 */

export interface WeatherSnapshot {
  date: string; // YYYY-MM-DD
  temp: number;
  humidity: number;
}

const STORAGE_KEY = 'digiw_well_weather_history';
const MAX_DAYS = 7;

export function saveWeatherSnapshot(snapshot: WeatherSnapshot): void {
  const history = getWeatherHistory();
  // Remove existing entry for same date
  const filtered = history.filter(h => h.date !== snapshot.date);
  filtered.push(snapshot);
  // Sort by date desc, keep MAX_DAYS
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  const trimmed = filtered.slice(0, MAX_DAYS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function getWeatherHistory(): WeatherSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WeatherSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildWeatherHistoryFromCurrent(
  currentWeather: { temp?: number; humidity?: number } | null | undefined,
): WeatherSnapshot[] {
  const history = getWeatherHistory();
  const today = new Date().toISOString().slice(0, 10);

  if (currentWeather?.temp !== undefined && currentWeather?.humidity !== undefined) {
    const todaySnapshot: WeatherSnapshot = {
      date: today,
      temp: currentWeather.temp,
      humidity: currentWeather.humidity,
    };
    // Replace or add today's data
    const withoutToday = history.filter(h => h.date !== today);
    withoutToday.push(todaySnapshot);
    withoutToday.sort((a, b) => b.date.localeCompare(a.date));
    saveWeatherSnapshot(todaySnapshot);
    return withoutToday.slice(0, MAX_DAYS);
  }

  return history;
}
