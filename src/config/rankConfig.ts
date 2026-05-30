// Rank types are defined locally below

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster';

export interface RankConfig {
  tier: RankTier;
  wpMin: number;
  wpMax: number;
  labelKey: string;
  color: string;
}

export const RANKS: RankConfig[] = [
  { tier: 'bronze',     wpMin: 0,     wpMax: 499,   labelKey: 'rank.bronze',     color: '#cd7f32' },
  { tier: 'silver',     wpMin: 500,   wpMax: 1499,  labelKey: 'rank.silver',     color: '#c0c0c0' },
  { tier: 'gold',       wpMin: 1500,  wpMax: 2999,  labelKey: 'rank.gold',       color: '#ffd700' },
  { tier: 'platinum',   wpMin: 3000,  wpMax: 4999,  labelKey: 'rank.platinum',  color: '#3eb489' },
  { tier: 'diamond',    wpMin: 5000,  wpMax: 7999,  labelKey: 'rank.diamond',   color: '#b9f2ff' },
  { tier: 'master',     wpMin: 8000,  wpMax: 11999, labelKey: 'rank.master',    color: '#a78bfa' },
  { tier: 'grandmaster',wpMin: 12000, wpMax: 99999, labelKey: 'rank.grandmaster',color: '#ff4ecd' },
];

export function getRankTier(wp: number): RankTier {
  if (wp >= 12000) return 'grandmaster';
  if (wp >= 8000) return 'master';
  if (wp >= 5000) return 'diamond';
  if (wp >= 3000) return 'platinum';
  if (wp >= 1500) return 'gold';
  if (wp >= 500) return 'silver';
  return 'bronze';
}

export function getNextRank(wp: number): { tier: RankTier; wpNeeded: number; progressPercent: number; labelKey: string } | null {
  const current = getRankTier(wp);
  const idx = RANKS.findIndex(r => r.tier === current);
  if (idx === -1 || idx >= RANKS.length - 1) return null;
  const next = RANKS[idx + 1];
  const range = next.wpMin - RANKS[idx].wpMin;
  const progress = range > 0 ? Math.min(100, Math.max(0, ((wp - RANKS[idx].wpMin) / range) * 100)) : 100;
  return {
    tier: next.tier,
    wpNeeded: next.wpMin - wp,
    progressPercent: Math.round(progress),
    labelKey: next.labelKey,
  };
}
