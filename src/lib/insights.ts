import { supabase } from './supabase';

export interface MonthlyDataResult {
  [day: string]: number;
}

export async function fetchMonthlyWaterData(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyDataResult> {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

  const { data, error } = await supabase
    .from('water_logs')
    .select('amount, day')
    .eq('user_id', userId)
    .gte('day', startDate)
    .lte('day', endDate);

  if (error) throw error;

  const dataMap: MonthlyDataResult = {};
  (data || []).forEach((log: { day: string; amount: number }) => {
    if (log.day && log.amount) {
      dataMap[log.day] = (dataMap[log.day] || 0) + log.amount;
    }
  });

  return dataMap;
}

export async function fetchDayLogs(
  userId: string,
  dateStr: string
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('day', dateStr)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export interface WaterLogWithAmount {
  id: string;
  user_id: string;
  amount: number;
  day: string;
  created_at: string;
  [key: string]: unknown;
}