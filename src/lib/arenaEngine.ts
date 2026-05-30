export type MatchResult = 'win' | 'loss' | 'draw';

export function getKFactor(matchesPlayed: number): number {
  if (matchesPlayed < 30) return 40;
  if (matchesPlayed < 100) return 20;
  return 10;
}

/**
 * Expected score for player A vs player B.
 * Uses WP with a divisor of 2000 (WP range is ~5x ELO range).
 * Equal WP → 0.5. 2000 WP gap → ~0.91 / ~0.09.
 */
export function calculateExpectedScore(wpA: number, wpB: number): number {
  return 1.0 / (1.0 + Math.pow(10, (wpB - wpA) / 2000));
}

/**
 * Zero-sum WP delta using ELO mechanics.
 * Winner gains WP from loser, proportional to expected outcome.
 */
export function calculateWpDelta(
  wpA: number,
  wpB: number,
  result: MatchResult,
  matchesA: number,
  matchesB: number
): { deltaA: number; deltaB: number } {
  const kA = getKFactor(matchesA);
  const kB = getKFactor(matchesB);

  const expectedA = calculateExpectedScore(wpA, wpB);
  const expectedB = calculateExpectedScore(wpB, wpA);

  const scoreA = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const scoreB = result === 'win' ? 0 : result === 'draw' ? 0.5 : 1;

  const deltaA = Math.round(kA * (scoreA - expectedA));
  const deltaB = Math.round(kB * (scoreB - expectedB));

  return { deltaA, deltaB };
}

export function calculateStakeReward(
  stake: number,
  result: MatchResult,
  winStreak: number
): { winnerReward: number; loserDeduction: number; refund: number } {
  const streakBonus = result === 'win' && winStreak + 1 >= 3
    ? Math.round(stake * 0.1)
    : 0;

  if (result === 'win') {
    return {
      winnerReward: Math.round(stake * 0.9) + streakBonus,
      loserDeduction: stake,
      refund: 0,
    };
  }

  if (result === 'draw') {
    return {
      winnerReward: 0,
      loserDeduction: 0,
      refund: stake,
    };
  }

  return {
    winnerReward: 0,
    loserDeduction: 0,
    refund: 0,
  };
}
