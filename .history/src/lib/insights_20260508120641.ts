import { supabase } from './supabase';
import type { WaterLog } from '../models';

const formatIsoDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export async function fetchMonthlyWaterMap(userId: string, monthDate: Date) {
  const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

  const startStr = formatIsoDate(startDate);
  const endStr = formatIsoDate(endDate);

  const { data, error } = await supabase
    .from('water_logs')
    .select('amount, day')
    .eq('user_id', userId)
    .gte('day', startStr)
    .lte('day', endStr);

  if (error) {
    throw error;
  }

  const dataMap: Record<string, number> = {};
  (data || []).forEach((log: any) => {
    if (log?.day && typeof log.amount === 'number') {
      dataMap[log.day] = (dataMap[log.day] || 0) + log.amount;
    }
  });

  return dataMap;
}

export async function fetchDailyWaterLogs(userId: string, day: string) {
  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('day', day)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as WaterLog[];
}
