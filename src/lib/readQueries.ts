import { supabaseRead } from './supabase';

export async function getPublicProfile(userId: string) {
  return supabaseRead.from('public_profiles').select('*').eq('id', userId).single();
}

export async function getLeaderboard(limit = 50) {
  return supabaseRead.from('profiles')
    .select('id, nickname, avatar_url, total_exp, level, water_today')
    .order('total_exp', { ascending: false })
    .limit(limit);
}

export async function getWeeklyLeaderboard(limit = 50) {
  return supabaseRead.from('profiles')
    .select('id, nickname, avatar_url, total_exp, level, week_exp')
    .order('week_exp', { ascending: false })
    .limit(limit);
}

export async function getFeedPosts(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return supabaseRead.from('social_feed')
    .select('*, author:user_id(id, nickname, avatar_url)')
    .order('created_at', { ascending: false })
    .range(from, to);
}

export async function getPublicUserStats(userId: string) {
  return supabaseRead.from('user_stats_public')
    .select('*')
    .eq('user_id', userId)
    .single();
}

export async function getClubLeaderboard(clubId: string) {
  return supabaseRead.from('club_members')
    .select('user_id, contribution, profiles!inner(nickname, avatar_url)')
    .eq('club_id', clubId)
    .order('contribution', { ascending: false });
}

export async function getActiveChallenges() {
  return supabaseRead.from('challenges')
    .select('*')
    .gte('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true });
}

export async function getShopItems() {
  return supabaseRead.from('shop_items')
    .select('*')
    .eq('is_active', true)
    .order('price_coins', { ascending: true });
}

export async function getGlobalAchievements() {
  return supabaseRead.from('achievements')
    .select('*')
    .order('category', { ascending: true });
}

export async function searchUsers(query: string, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return supabaseRead.rpc('search_users', { search_query: query })
    .range(from, to);
}
