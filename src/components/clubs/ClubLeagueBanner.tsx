import { useState, useEffect } from 'react';
import { Shield, Trophy, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LeagueData {
  league: { name: string; icon: string; color: string; min_points: number };
  points: number;
  rank: number;
}

interface ClubLeagueBannerProps {
  clubId: string;
  onOpenRankings: () => void;
}

export default function ClubLeagueBanner({ clubId, onOpenRankings }: ClubLeagueBannerProps) {
  const [league, setLeague] = useState<LeagueData | null>(null);

  useEffect(() => {
    supabase.rpc('get_club_league', { p_club_id: clubId }).then(({ data, error }) => {
      if (!error && data) setLeague(data as LeagueData);
    });
  }, [clubId]);

  if (!league) return null;

  const colorMap: Record<string, string> = {
    'Bronze': 'from-amber-700/20 to-amber-900/10 border-amber-700/30 text-amber-600',
    'Silver': 'from-slate-400/20 to-slate-600/10 border-slate-400/30 text-slate-300',
    'Gold': 'from-yellow-400/20 to-yellow-600/10 border-yellow-400/30 text-yellow-400',
    'Platinum': 'from-cyan-400/20 to-cyan-600/10 border-cyan-400/30 text-cyan-400',
    'Diamond': 'from-purple-400/20 to-purple-600/10 border-purple-400/30 text-purple-400',
  };
  const bgClass = colorMap[league.league.name] ?? 'from-slate-500/20 to-slate-700/10 border-slate-500/30 text-slate-400';

  return (
    <button onClick={onOpenRankings} className={`w-full rounded-2xl border p-4 ${bgClass} bg-gradient-to-br text-left`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} />
          <span className="text-sm font-bold">{league.league.name} League</span>
        </div>
        <ChevronRight size={16} className="opacity-50" />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs opacity-70">
          <Trophy size={14} />
          <span>Hạng #{league.rank}</span>
        </div>
        <span className="text-xs font-semibold">{league.points} điểm</span>
      </div>
    </button>
  );
}
