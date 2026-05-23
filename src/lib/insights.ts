import { supabase } from './supabase';

export interface MonthlyDataResult {
  [day: string]: number;
}

export async function fetchMonthlyWaterData(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyDataResult> {
  const monthStr = String(month + 1).padStart(2, '0');
  const startDateStr = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDateStr = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .rpc('get_monthly_water_aggregated', {
      p_user_id: userId,
      p_start_date: startDateStr,
      p_end_date: endDateStr
    });

  if (error) throw error;

  const dataMap: MonthlyDataResult = {};
  (data || []).forEach((log: { day: string; total_amount: number }) => {
    if (log.day && log.total_amount) {
      dataMap[log.day] = log.total_amount;
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