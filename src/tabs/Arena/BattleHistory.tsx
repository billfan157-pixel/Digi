import React from 'react';
import { TrendingUp, Trophy, Shield, X, Coins } from 'lucide-react';
import type { Battle, Profile } from '../../models';
import { glassInner } from '../../styles/glass';

interface BattleHistoryProps {
  battles: Battle[];
  profile: Profile | null;
}

const BattleHistory: React.FC<BattleHistoryProps> = ({ battles, profile }) => {
  const completedBattles = battles.filter(b => b.status === 'completed').slice(0, 5);

  if (completedBattles.length === 0) return null;

  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-black text-lg flex items-center gap-2 tracking-tight">
          <TrendingUp size={20} className="text-emerald-400" /> Lịch sử đấu
        </h3>
        <button className="text-[10px] font-black text-slate-500 hover:text-cyan-400 uppercase tracking-[0.2em] transition-colors">
          Xem tất cả
        </button>
      </div>

      <div className="space-y-3">
        {completedBattles.map((battle, index) => {
          const isWin = battle.winner_id === profile?.id;
          const isDraw = battle.winner_id === null;
          const isChallenger = battle.challenger_id === profile?.id;
          const opponent = isChallenger ? battle.opponent : battle.challenger;

          return (
            <div key={battle.id || `history-battle-${index}`} className={`${glassInner} flex items-center justify-between py-4 px-5 rounded-3xl hover:bg-white/5 transition-all group`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                  isWin ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-110' : 
                  isDraw ? 'bg-slate-500/10 border-slate-500/20 text-slate-400 group-hover:scale-110' : 
                  'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)] group-hover:scale-110'
                }`}>
                  {isWin ? <Trophy size={20} /> : isDraw ? <Shield size={20} /> : <X size={20} />}
                </div>
                <div>
                  <p className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">
                    vs {opponent?.nickname || 'Đối thủ'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      isWin ? 'text-emerald-500' : isDraw ? 'text-slate-500' : 'text-rose-500'
                    }`}>
                      {isWin ? 'Chiến thắng' : isDraw ? 'Hòa cuộc' : 'Thất bại'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`flex items-center justify-end gap-1.5 text-sm font-black ${
                  isWin ? 'text-amber-400' : 'text-slate-500'
                }`}>
                  {isWin ? '+' : '-'}{battle.stake_coins} <Coins size={14} className={isWin ? "fill-amber-400/20" : ""} />
                </div>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1.5 opacity-60">
                  {new Date(battle.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BattleHistory;
