export type LeagueMode = 'public' | 'friends' | 'clubs';
export type LeagueView = 'all' | 'top10' | 'around';

export interface LeagueEntry {
  id?: string;
  name: string;
  dept: string;
  wp: number;
  streak: number;
  isMe: boolean;
}

export interface RankInfo {
  name: string;
  color: string;
  bg: string;
  border: string;
}