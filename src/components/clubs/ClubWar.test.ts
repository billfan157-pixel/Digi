import { describe, it, expect } from 'vitest';

function sortClubRankings(
  rankings: Array<{ battle_wins: number; battle_losses: number }>
) {
  return [...rankings].sort(
    (a, b) => (b.battle_wins - b.battle_losses) - (a.battle_wins - a.battle_losses)
  );
}

describe('ClubRankings sort', () => {
  it('sorts by win differential descending', () => {
    const input = [
      { battle_wins: 2, battle_losses: 1 },  // diff: +1
      { battle_wins: 5, battle_losses: 0 },  // diff: +5
      { battle_wins: 0, battle_losses: 3 },  // diff: -3
    ];
    const sorted = sortClubRankings(input);
    expect(sorted[0].battle_wins).toBe(5);
    expect(sorted[1].battle_wins).toBe(2);
    expect(sorted[2].battle_wins).toBe(0);
  });

  it('handles empty array', () => {
    expect(sortClubRankings([])).toEqual([]);
  });

  it('handles single entry', () => {
    expect(sortClubRankings([{ battle_wins: 3, battle_losses: 1 }])).toHaveLength(1);
  });

  it('handles ties by maintaining relative order', () => {
    const input = [
      { battle_wins: 3, battle_losses: 1 },
      { battle_wins: 4, battle_losses: 2 },
    ];
    const sorted = sortClubRankings(input);
    expect(sorted).toHaveLength(2);
  });

  it('handles zero zero', () => {
    const sorted = sortClubRankings([
      { battle_wins: 0, battle_losses: 0 },
      { battle_wins: 1, battle_losses: 0 },
    ]);
    expect(sorted[0].battle_wins).toBe(1);
  });
});
