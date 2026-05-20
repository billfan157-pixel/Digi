import { supabase } from './supabase';

export interface ClubChallenge {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  target_ml: number;
  start_date: string;
  end_date: string;
  created_at: string | null;
}

export interface ChallengeProgress {
  total_ml: number;
  member_count: number;
  percent: number;
}

export async function fetchActiveChallenge(clubId: string): Promise<ClubChallenge | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('club_challenges')
    .select('*')
    .eq('club_id', clubId)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[clubChallenges] fetchActiveChallenge error:', error);
    return null;
  }

  return data?.[0] ?? null;
}

export async function fetchChallengeProgress(clubId: string, startDate: string, endDate: string): Promise<ChallengeProgress> {
  const now = new Date().toISOString();
  const effectiveEnd = endDate < now ? endDate : now;

  const { data, error } = await supabase
    .from('club_activity')
    .select('amount, user_id')
    .eq('club_id', clubId)
    .gte('created_at', startDate)
    .lte('created_at', effectiveEnd);

  if (error) {
    console.error('[clubChallenges] fetchChallengeProgress error:', error);
    return { total_ml: 0, member_count: 0, percent: 0 };
  }

  const totalMl = data.reduce((sum, row) => sum + (row.amount || 0), 0);
  const uniqueMembers = new Set(data.map(row => row.user_id).filter(Boolean));

  return {
    total_ml: totalMl,
    member_count: uniqueMembers.size,
    percent: 0,
  };
}

export async function createChallenge(opts: {
  clubId: string;
  userId: string;
  title: string;
  targetMl: number;
  durationDays: number;
}): Promise<ClubChallenge | null> {
  const now = new Date();
  const endDate = new Date(now.getTime() + opts.durationDays * 86400000);

  const { data, error } = await supabase
    .from('club_challenges')
    .insert({
      club_id: opts.clubId,
      created_by: opts.userId,
      title: opts.title,
      target_ml: opts.targetMl,
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[clubChallenges] createChallenge error:', error);
    return null;
  }

  return data;
}
