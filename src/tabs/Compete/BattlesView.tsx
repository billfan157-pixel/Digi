import React from 'react';
import { useTranslation } from 'react-i18next';
import { Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Profile, Battle } from '@/models';
import BattleModes from '@/tabs/Arena/BattleModes';
import ActiveBattles from '@/tabs/Arena/ActiveBattles';
import BattleHistory from '@/tabs/Arena/BattleHistory';

interface BattlesViewProps {
  profile: Profile | null;
  battles: Battle[];
  activeBattles: Battle[];
  now: number;
  selectedMode: 'daily' | 'quick' | 'tournament' | null;
  setSelectedMode: (mode: 'daily' | 'quick' | 'tournament' | null) => void;
  onEnterQueue: (mode: 'daily' | 'quick' | 'tournament', stake: number) => Promise<void>;
  isQueuing: boolean;
  isLoading: boolean;
  onSelectBattle: (battle: Battle) => void;
}

const BattlesView = React.memo(function BattlesView({
  profile,
  battles,
  activeBattles,
  now,
  selectedMode,
  setSelectedMode,
  onEnterQueue,
  isQueuing,
  isLoading,
  onSelectBattle,
}: BattlesViewProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="h-40 rounded-3xl bg-slate-900/40 border border-white/5 animate-pulse mx-5" />
    );
  }

  return (
    <div className="px-5 space-y-6 pb-6">
      {/* Active Battles */}
      {activeBattles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t('battle.active_battles', 'Trận đang diễn ra')}
            </h3>
          </div>
          <ActiveBattles
            battles={activeBattles}
            profile={profile}
            now={now}
            onSelectBattle={onSelectBattle}
          />
        </section>
      )}

      {/* Battle Modes */}
      <section>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          {t('battle.game_modes', 'Chế độ thi đấu')}
        </h3>
        <BattleModes
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          onEnterQueue={onEnterQueue}
          isQueuing={isQueuing}
          totalMatches={battles.filter(b => b.status === 'completed').length}
        />
      </section>

      {/* Battle History */}
      {battles.length > 0 && (
        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            {t('battle.recent_history', 'Lịch sử gần đây')}
          </h3>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <BattleHistory
              battles={battles}
              profile={profile}
            />
          </motion.div>
        </section>
      )}

      {/* Empty State */}
      {battles.length === 0 && (
        <div className="py-16 flex flex-col items-center justify-center bg-slate-900/40 border border-dashed border-white/5 rounded-[3rem] group">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-800 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-rose-500/30 transition-all duration-500">
            <Swords size={32} className="text-slate-600 group-hover:text-rose-500 transition-colors" />
          </div>
          <p className="text-white text-lg font-black mb-2 tracking-tight">{t('common.no_battles_yet')}</p>
          <p className="text-slate-500 text-xs text-center px-10 font-medium leading-relaxed">
            {t('battle.info_hint')}
          </p>
        </div>
      )}
    </div>
  );
});

export default BattlesView;
