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
}

const isValidProfileId = (profileId: string | undefined) =>
  !!profileId && profileId !== 'undefined' && profileId.length === 36;

const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

function toAppProfile(profileRow: any): AppProfile {
  const normalizedProfile = normalizeProfileEnums(profileRow);
  const calculatedLevel = levelFromExp(normalizedProfile.total_exp || 0);

  return {
    id: normalizedProfile.id,
    nickname: normalizedProfile.nickname,
    password: '',
    avatar_url: normalizedProfile.avatar_url,
    gender: normalizedProfile.gender,
    age: normalizedProfile.age,
    height: normalizedProfile.height,
    weight: normalizedProfile.weight,
    activity: normalizedProfile.activity,
    climate: normalizedProfile.climate,
    goal: normalizedProfile.goal,
    wakeUp: normalizedProfile.wake_up,
    bedTime: normalizedProfile.bed_time,
    water_goal: normalizedProfile.water_goal,
    wp: normalizedProfile.wp,
    coins: normalizedProfile.coins,
    total_exp: normalizedProfile.total_exp,
    level: calculatedLevel,
    current_exp: normalizedProfile.current_exp,
    water_today: normalizedProfile.water_today,
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
  };
}

async function normalizeProfileRow(profileRow: any) {
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
      .eq('id', profileRow.id)
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
