/**
 * Pure arena / ranked duel math utilities.
 * Mirrors the logic in the resolve_ranked_battle RPC.
 */

export type MatchResult = 'win' | 'loss' | 'draw';

export function getKFactor(matchesPlayed: number): number {
  if (matchesPlayed < 30) return 40;
  if (matchesPlayed < 100) return 20;
  return 10;
}

export function calculateExpectedScore(eloA: number, eloB: number): number {
  return 1.0 / (1.0 + Math.pow(10, (eloB - eloA) / 400));
}

export function calculateEloDelta(
  eloA: number,
  eloB: number,
  result: MatchResult,
  matchesA: number,
  matchesB: number
): { deltaA: number; deltaB: number } {
  const kA = getKFactor(matchesA);
  const kB = getKFactor(matchesB);

  const expectedA = calculateExpectedScore(eloA, eloB);
  const expectedB = calculateExpectedScore(eloB, eloA);

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
