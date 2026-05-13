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
  icon?: string;
  glow?: string;
}

export const LEAGUE_TIERS: Record<string, RankInfo> = {
  bronze: { name: 'Đồng', color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'shadow-orange-500/10' },
  silver: { name: 'Bạc', color: 'text-slate-300', bg: 'bg-slate-400/10', border: 'border-slate-400/20', glow: 'shadow-slate-400/10' },
  gold: { name: 'Vàng', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', glow: 'shadow-yellow-500/10' },
  platinum: { name: 'Bạch Kim', color: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/10' },
  diamond: { name: 'Kim Cương', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-blue-500/10' },
  master: { name: 'Cao Thủ', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', glow: 'shadow-purple-500/10' },
  grandmaster: { name: 'Đại Cao Thủ', color: 'text-rose-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', glow: 'shadow-purple-500/10' },
};

export const getTierByWP = (wp: number): RankInfo => {
  if (wp >= 12000) return LEAGUE_TIERS.grandmaster;
  if (wp >= 8000) return LEAGUE_TIERS.master;
  if (wp >= 5000) return LEAGUE_TIERS.diamond;
  if (wp >= 3000) return LEAGUE_TIERS.platinum;
  if (wp >= 1500) return LEAGUE_TIERS.gold;
  if (wp >= 500) return LEAGUE_TIERS.silver;
  return LEAGUE_TIERS.bronze;
};