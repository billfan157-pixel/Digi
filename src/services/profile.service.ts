import { levelFromExp } from '@/config/questConfig';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/models';
import { getProfileEnumPatch, normalizeProfileEnums } from '@/lib/profileNormalization';

export interface AppProfile extends Profile {
  bedTime?: string;
  current_exp?: number;
  onboarding_completed?: boolean;
  password?: string;
  total_water?: number;
  wakeUp?: string;
  // Wellness fields
  sleep_hours?: number;
  sleep_quality?: number;
  mood_tracking?: boolean;
  sync_wellness_data?: boolean;
  energy_tracking?: boolean;
  grace_period_end?: string | null;
  calendar_privacy_level?: 'strict' | 'standard' | 'off';
  leaderboard_opt_in?: boolean;
}

const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

interface ProfileRow {
  id?: string;
  nickname?: string;
  avatar_url?: string | null;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  activity?: string;
  climate?: string;
  goal?: string;
  wake_up?: string;
  bed_time?: string;
  water_goal?: number;
  wp?: number;
  coins?: number;
  total_exp?: number;
  current_exp?: number;
  water_today?: number;
  total_water?: number;
  onboarding_completed?: boolean;
  equipped_bottle_id?: string | null;
  equipped_frame_id?: string | null;
  equipped_theme_id?: string | null;
  equipped_notification_sound?: string | null;
  created_at?: string;
  updated_at?: string;
  sleep_hours?: number;
  sleep_quality?: number;
  mood_tracking?: boolean;
  sync_wellness_data?: boolean;
  energy_tracking?: boolean;
  grace_period_end?: string | null;
  last_water_date?: string;
  level?: number;
  calendar_privacy_level?: 'strict' | 'standard' | 'off';
  leaderboard_opt_in?: boolean;
  [key: string]: unknown;
}

function toAppProfile(profileRow: ProfileRow): AppProfile {
  const normalizedProfile = normalizeProfileEnums(profileRow) as ProfileRow;
  const calculatedLevel = levelFromExp(normalizedProfile.total_exp || 0);

  return {
    id: normalizedProfile.id || '',
    nickname: normalizedProfile.nickname || '',
    password: '',
    avatar_url: normalizedProfile.avatar_url ?? null,
    gender: (normalizedProfile.gender as Profile['gender']) || 'Khác',
    age: normalizedProfile.age || 0,
    height: normalizedProfile.height || 0,
    weight: normalizedProfile.weight || 0,
    activity: (normalizedProfile.activity as Profile['activity']) || 'sedentary',
    climate: (normalizedProfile.climate as Profile['climate']) || 'temperate',
    goal: normalizedProfile.goal || '',
    wakeUp: normalizedProfile.wake_up,
    bedTime: normalizedProfile.bed_time,
    water_goal: normalizedProfile.water_goal || 2000,
    wp: normalizedProfile.wp || 0,
    coins: normalizedProfile.coins || 0,
    total_exp: normalizedProfile.total_exp || 0,
    level: calculatedLevel,
    current_exp: normalizedProfile.current_exp,
    water_today: normalizedProfile.water_today || 0,
    total_water: normalizedProfile.total_water,
    onboarding_completed: normalizedProfile.onboarding_completed,
    equipped_bottle_id: normalizedProfile.equipped_bottle_id ?? null,
    equipped_frame_id: normalizedProfile.equipped_frame_id ?? null,
    equipped_theme_id: normalizedProfile.equipped_theme_id ?? 'theme_default',
    equipped_notification_sound: normalizedProfile.equipped_notification_sound ?? null,
    created_at: normalizedProfile.created_at,
    updated_at: normalizedProfile.updated_at,
    // Wellness fields
    sleep_hours: normalizedProfile.sleep_hours,
    sleep_quality: normalizedProfile.sleep_quality,
    mood_tracking: normalizedProfile.mood_tracking,
    sync_wellness_data: normalizedProfile.sync_wellness_data,
    energy_tracking: normalizedProfile.energy_tracking,
    grace_period_end: normalizedProfile.grace_period_end,
    calendar_privacy_level: (normalizedProfile.calendar_privacy_level as AppProfile['calendar_privacy_level']) || 'standard',
    leaderboard_opt_in: normalizedProfile.leaderboard_opt_in !== false,
  };
}

async function normalizeProfileRow(profileRow: ProfileRow) {
  const profilePatch: Record<string, unknown> = {
    ...getProfileEnumPatch(profileRow),
  };

  if (profileRow.last_water_date !== getTodayKey()) {
    profilePatch.water_today = 0;
    profilePatch.last_water_date = getTodayKey();
  }

  const calculatedLevel = levelFromExp(profileRow.total_exp || 0);
  if (profileRow.level !== calculatedLevel) {
    profilePatch.level = calculatedLevel;
  }

  if (Object.keys(profilePatch).length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profilePatch)
      .eq('id', profileRow.id ?? '')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  return profileRow;
}



export async function fetchProfileById(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const normalizedRow = await normalizeProfileRow(data);
  return toAppProfile(normalizedRow);
}

export async function fetchCurrentProfile() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const userId = data.session?.user.id;
  if (!userId) return null;

  return fetchProfileById(userId);
}

export async function ensureProfileExists(userId: string, defaultName: string) {
  await supabase.from('profiles').upsert([{
    id: userId,
    nickname: defaultName,
    gender: 'Nam',
    age: 20,
    height: 170,
    weight: 60,
    activity: 'high',
    climate: 'tropical',
    goal: 'Sức khỏe tổng quát',
  }], { onConflict: 'id' });

  return fetchProfileById(userId);
}

export async function updateProfileFields(userId: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;

  const appProfile = toAppProfile(data);
  return appProfile;
}

export async function uploadProfileAvatar(userId: string, image: Blob) {
  const filePath = `${userId}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, image, { upsert: true, contentType: 'image/jpeg' });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return updateProfileFields(userId, { avatar_url: data.publicUrl });
}

export async function deleteCurrentUserAccount() {
  const { error } = await supabase.rpc('delete_user_account');
  if (error) throw error;
}
