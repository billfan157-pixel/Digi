import { supabase } from '@/lib/supabase';
import type { WaterLog } from '@/models';

export async function fetchWaterLogs(userId: string, day: string): Promise<WaterLog[]> {
  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('day', day)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function insertWaterLog(params: {
  user_id: string;
  amount: number;
  name: string;
  exp: number;
  day: string;
  created_at?: string;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('water_logs')
    .insert({
      user_id: params.user_id,
      amount: params.amount,
      name: params.name,
      exp: params.exp,
      day: params.day,
      ...(params.created_at ? { created_at: params.created_at } : {}),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function processHydrationEvent(params: {
  p_user_id: string;
  p_amount_ml: number;
  p_temp_c: number | null;
  p_exercise_mins: number;
  p_is_fasting: boolean;
}) {
  const { error } = await supabase.rpc('process_hydration_event', params);
  if (error) throw error;
}

export async function deleteWaterLog(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('water_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateWaterLog(id: string, userId: string, updates: {
  amount: number;
  exp: number;
}): Promise<void> {
  const { error } = await supabase
    .from('water_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function findExistingWaterLog(params: {
  user_id: string;
  day: string;
  amount: number;
  name: string;
  created_at: string;
}): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('water_logs')
    .select('id')
    .eq('user_id', params.user_id)
    .eq('day', params.day)
    .eq('amount', params.amount)
    .eq('name', params.name)
    .eq('created_at', params.created_at)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchUserClubs(userId: string): Promise<{ club_id: string }[]> {
  const { data, error } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data ?? [];
}

export async function incrementClubIntake(params: {
  p_user_id: string;
  p_club_id: string;
  p_amount_to_add: number;
}): Promise<void> {
  const { error } = await supabase.rpc('increment_club_member_intake', params);
  if (error) throw error;
}

export async function insertClubActivity(params: {
  club_id: string;
  user_id: string;
  activity_type: string;
  message: string;
}): Promise<void> {
  const { error } = await supabase.from('club_activity').insert(params);
  if (error) throw error;
}
