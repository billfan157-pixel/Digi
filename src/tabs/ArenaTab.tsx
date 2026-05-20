import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { Swords, Loader2, Crown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type { Profile, Battle } from '../models';
import TabHeader from '../components/layout/TabHeader';

// Sub-components
import ArenaStatsHero from './Arena/ArenaStatsHero';
import BattleModes from './Arena/BattleModes';
import ActiveBattles from './Arena/ActiveBattles';
import BattleHistory from './Arena/BattleHistory';
import BattleDetailModal from './Arena/BattleDetailModal';

interface ArenaStats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
  rank: number;
  rating: number;
  totalCoins: number;
}

interface ArenaTabProps {
  profile: Profile | null;
}

const ArenaTab = memo(({ profile }: ArenaTabProps) => {
  const [selectedMode, setSelectedMode] = useState<'daily' | 'quick' | 'tournament' | null>(null);
  const [showBattleDetail, setShowBattleDetail] = useState<Battle | null>(null);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [stats, setStats] = useState<ArenaStats>({ wins: 0, losses: 0, draws: 0, winStreak: 0, bestStreak: 0, rank: 999, rating: 1200, totalCoins: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const fetchArenaDataRef = useRef<() => Promise<void>>(async () => {});
  const fetchArenaData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
          .from('hydration_battles')
          .select(`
            *, 
            challenger:public_profiles!hydration_battles_challenger_public_profile_fkey(id, nickname, avatar_url, water_today, water_goal), 
            opponent:public_profiles!hydration_battles_opponent_public_profile_fkey(id, nickname, avatar_url, water_today, water_goal)
          `)
          .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setBattles(data);
          let wins = 0, losses = 0, draws = 0;
          data.forEach((b: Battle) => {
            if (b.status === 'completed') {
              if (b.winner_id === profile.id) wins++;
              else if (b.winner_id === null) draws++;
              else losses++;
            }
          });
          const rating = 1200 + (wins * 25) - (losses * 15);
          setStats({ wins, losses, draws, winStreak: 0, bestStreak: 0, rank: 99, rating, totalCoins: 0 });
        }
      } catch (err) {
        console.error(err);
        toast.error('Lỗi tải dữ liệu Đấu trường');
      } finally {
        setIsLoading(false);
      }
  }, [profile?.id]);
  fetchArenaDataRef.current = fetchArenaData;

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase.channel(`battles:${profile.id}`)
      .on('postgres_changes' as never, {
        event: '*',
        schema: 'public',
        table: 'hydration_battles',
        filter: `challenger_id=eq.${profile.id}`,
      }, () => {
        fetchArenaDataRef.current();
      })
      .on('postgres_changes' as never, {
        event: '*',
        schema: 'public',
        table: 'hydration_battles',
        filter: `opponent_id=eq.${profile.id}`,
      }, () => {
        fetchArenaDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeBattles = battles.filter(b => b.status === 'active');
  const winRate = stats.wins + stats.losses > 0 ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) : 0;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="animate-spin text-cyan-400" size={40} />
          <Swords className="absolute inset-0 m-auto text-rose-500 opacity-50" size={16} />
        </div>
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Đang nạp dữ liệu võ đài...</p>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right duration-300 pb-10 pt-2 custom-scrollbar">
      {/* Header */}
      <TabHeader
        label="KHU VỰC THÁCH ĐẤU"
        title={
          <span className="flex items-center gap-3">
            Võ Đài <Swords size={24} className="text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
          </span>
        }
        profile={profile}
        actionIcon={<Crown size={18} />}
      />

      {/* Hero Stats */}
      <ArenaStatsHero 
        winRate={winRate} 
        wins={stats.wins} 
        losses={stats.losses} 
        rank={stats.rank} 
        rating={stats.rating} 
      />

      {/* Battle Modes Selection */}
      <BattleModes 
        selectedMode={selectedMode} 
        setSelectedMode={setSelectedMode} 
      />

      {/* Active Battles List */}
      <ActiveBattles 
        battles={activeBattles} 
        profile={profile} 
        now={now} 
        onSelectBattle={setShowBattleDetail} 
      />

      {/* Recent Battle History */}
      <BattleHistory 
        battles={battles} 
        profile={profile} 
      />

      {/* Empty State when no battles found at all */}
      {battles.length === 0 && (
        <div className="px-5 py-16 flex flex-col items-center justify-center bg-slate-900/40 border border-dashed border-white/5 rounded-[3rem] mx-5 mt-4 group">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-800 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-rose-500/30 transition-all duration-500">
            <Swords size={32} className="text-slate-600 group-hover:text-rose-500 transition-colors" />
          </div>
          <p className="text-white text-lg font-black mb-2 tracking-tight">Chưa có trận đấu nào</p>
          <p className="text-slate-500 text-xs text-center px-10 font-medium leading-relaxed">
            Chọn một chế độ thách đấu ở trên để bắt đầu tìm kiếm đối thủ và so tài ngay hôm nay!
          </p>
        </div>
      )}

      {/* Battle Detail Modal */}
      <AnimatePresence>
        {showBattleDetail && (
          <BattleDetailModal
            key="battle-detail-modal"
            battle={showBattleDetail}
            profile={profile}
            now={now}
            onClose={() => setShowBattleDetail(null)}
            onActionComplete={() => { fetchArenaDataRef.current(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default ArenaTab;
