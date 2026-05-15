import { useEffect, useState, useCallback } from 'react';
import { fetchMonthlyWaterData, fetchDayLogs } from '../lib/insights';

export interface UseInsightDataResult {
  monthlyDataMap: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  refetchMonthly: () => Promise<void>;
  fetchDayLogs: (dateStr: string) => Promise<unknown[]>;
}

export function useInsightData(profileId: string | undefined, calendarDate: Date) {
  const [monthlyDataMap, setMonthlyDataMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthKey = `${calendarDate.getFullYear()}-${calendarDate.getMonth()}`;

  const loadMonthlyData = useCallback(async () => {
    if (!profileId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMonthlyWaterData(
        profileId,
        calendarDate.getFullYear(),
        calendarDate.getMonth()
      );
      setMonthlyDataMap(data);
    } catch (err) {
      setError('Lỗi tải dữ liệu tháng');
      console.error('Lỗi tải dữ liệu tháng:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, calendarDate]);

  useEffect(() => {
    loadMonthlyData();
  }, [loadMonthlyData, monthKey]);

  const fetchDayLogsAsync = useCallback(async (dateStr: string) => {
    if (!profileId) return [];
    
    try {
      return await fetchDayLogs(profileId, dateStr);
    } catch (err) {
      console.error('Lỗi tải lịch sử ngày:', err);
      return [];
    }
  }, [profileId]);

  return {
    monthlyDataMap,
    isLoading,
    error,
    refetchMonthly: loadMonthlyData,
    fetchDayLogs: fetchDayLogsAsync,
  };
}