export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'mythic';

export interface RankConfig {
  tier: RankTier;
  eloMin: number;
  eloMax: number;
  labelVi: string;
  labelEn: string;
  color: string;
}

export const RANKS: RankConfig[] = [
  { tier: 'bronze',   eloMin: 0,    eloMax: 999,  labelVi: 'Đồng',     labelEn: 'Bronze',    color: '#cd7f32' },
  { tier: 'silver',   eloMin: 1000, eloMax: 1199, labelVi: 'Bạc',      labelEn: 'Silver',    color: '#c0c0c0' },
  { tier: 'gold',     eloMin: 1200, eloMax: 1399, labelVi: 'Vàng',     labelEn: 'Gold',      color: '#ffd700' },
  { tier: 'platinum', eloMin: 1400, eloMax: 1599, labelVi: 'Bạch Kim', labelEn: 'Platinum',  color: '#3eb489' },
  { tier: 'diamond',  eloMin: 1600, eloMax: 1799, labelVi: 'Kim Cương',labelEn: 'Diamond',   color: '#b9f2ff' },
  { tier: 'mythic',   eloMin: 1800, eloMax: 9999, labelVi: 'Thần Thoại',labelEn: 'Mythic',   color: '#ff4ecd' },
];

export function getRankTier(elo: number): RankTier {
  if (elo >= 1800) return 'mythic';
  if (elo >= 1600) return 'diamond';
  if (elo >= 1400) return 'platinum';
  if (elo >= 1200) return 'gold';
  if (elo >= 1000) return 'silver';
  return 'bronze';
}

export function getRankDivision(elo: number): 'I' | 'II' | 'III' | '' {
  const tier = getRankTier(elo);
  if (tier === 'mythic') return ''; // Thần Thoại không chia bậc phụ
  
  const rank = RANKS.find(r => r.tier === tier);
  if (!rank) return 'III';
  
  const totalRange = rank.eloMax - rank.eloMin + 1;
  const third = totalRange / 3;
  const relative = elo - rank.eloMin;
  
  if (relative < third) return 'III';
  if (relative < third * 2) return 'II';
  return 'I';
}

export function getNextRank(elo: number): { tier: RankTier; eloNeeded: number; progressPercent: number; labelVi: string; labelEn: string } | null {
  const current = getRankTier(elo);
  const idx = RANKS.findIndex(r => r.tier === current);
  if (idx === -1 || idx >= RANKS.length - 1) return null;
  const next = RANKS[idx + 1];
  const range = next.eloMin - RANKS[idx].eloMin;
  const progress = Math.min(100, Math.max(0, ((elo - RANKS[idx].eloMin) / range) * 100));
  return {
    tier: next.tier,
    eloNeeded: next.eloMin - elo,
    progressPercent: Math.round(progress),
    labelVi: next.labelVi,
    labelEn: next.labelEn,
  };
}

