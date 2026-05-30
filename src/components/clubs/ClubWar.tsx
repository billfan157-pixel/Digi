import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Swords,
  Trophy,
  Loader2,
  Clock,
  Users,
  Medal,
  X,
  Check,
  Flame,

} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useClubBattles } from '../../hooks/useClubBattles';
import { supabase } from '../../lib/supabase';
import ClubChest from './ClubChest';
import ClubLeagueBanner from './ClubLeagueBanner';
import ClubLeagueRankings from './ClubLeagueRankings';

interface ClubWarProps {
  clubId: string;
  userId: string;
  isAdmin: boolean;
}

interface SimpleClub {
  id: string;
  name: string;
  member_count: number;
}

interface Participant {
  user_id: string;
  total_water: number;
  nickname?: string;
}

export default function ClubWar({ clubId, userId, isAdmin }: ClubWarProps) {
  const { t } = useTranslation();
  const { activeBattle, battleHistory, loading, createBattle, acceptBattle, contribute } = useClubBattles(clubId);
  const [showChallenge, setShowChallenge] = useState(false);
  const [allClubs, setAllClubs] = useState<SimpleClub[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [targetMl, setTargetMl] = useState(5000);
  const [stakeCoins, setStakeCoins] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [showLeagueRankings, setShowLeagueRankings] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const channel = supabase.channel(`club-war-${clubId}`)
      .on('postgres_changes' as never, {
        event: 'UPDATE',
        schema: 'public',
        table: 'club_battles',
        filter: `challenger_club_id=eq.${clubId}`,
      }, (payload: { new: { status: string; winner_club_id: string | null } }) => {
        if (payload.new.status === 'completed') {
          const won = payload.new.winner_club_id === clubId;
          toast.success(won ? t('club.battle_won') : t('club.battle_lost'));
        }
      })
      .on('postgres_changes' as never, {
        event: 'UPDATE',
        schema: 'public',
        table: 'club_battles',
        filter: `opponent_club_id=eq.${clubId}`,
      }, (payload: { new: { status: string; winner_club_id: string | null } }) => {
        if (payload.new.status === 'completed') {
          const won = payload.new.winner_club_id === clubId;
          toast.success(won ? t('club.battle_won') : t('club.battle_lost'));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clubId]);

  const handleOpenChallenge = async () => {
    const { data, error } = await supabase
      .from('clubs')
      .select('id, name, member_count')
      .neq('id', clubId)
      .order('name');
    if (error) {
      toast.error(t('club.cannot_load_list'));
      return;
    }
    setAllClubs(data ?? []);
    setShowChallenge(true);
  };

  const handleSendChallenge = async () => {
    if (!selectedOpponent) {
      toast.error(t('club.please_select_opponent'));
      return;
    }
    await createBattle.mutateAsync({
      opponent_club_id: selectedOpponent,
      target_ml: targetMl,
      stake_coins: stakeCoins,
    });
    setShowChallenge(false);
    setSelectedOpponent('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {activeBattle && (
        <ActiveBattleCard
          battle={activeBattle}
          clubId={clubId}
          userId={userId}
          isAdmin={isAdmin}
          now={now}
          onAccept={() => acceptBattle.mutate(activeBattle.id)}
          onContribute={(amount: number) =>
            contribute.mutate({ battle_id: activeBattle.id, amount })
          }
        />
      )}

      {isAdmin && !activeBattle && (
        <button
          onClick={handleOpenChallenge}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 text-purple-400 font-bold text-sm hover:from-purple-600/30 hover:to-cyan-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Swords size={18} /> {t('club.challenge_other_club')}
        </button>
      )}

      <ClubChest clubId={clubId} />
      <ClubLeagueBanner clubId={clubId} onOpenRankings={() => setShowLeagueRankings(true)} />

      <AnimatePresence>
        {showLeagueRankings && <ClubLeagueRankings onClose={() => setShowLeagueRankings(false)} />}
      </AnimatePresence>

      {battleHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Trophy className="text-amber-400" size={18} />
            {t('club.battle_history')}
          </h3>
          <div className="space-y-2">
            {battleHistory.map((b) => {
              const isChallenger = b.challenger_club_id === clubId;
              const allyName = isChallenger ? b.challenger_name : b.opponent_name;
              const enemyName = isChallenger ? b.opponent_name : b.challenger_name;
              const allyTotal = isChallenger ? b.challenger_total : b.opponent_total;
              const enemyTotal = isChallenger ? b.opponent_total : b.challenger_total;
              const won = b.winner_club_id === clubId;

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white font-semibold">{enemyName}</span>
                      <span className="text-slate-500">vs</span>
                      <span className="text-white font-semibold">{allyName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>
                        {allyTotal.toLocaleString()} - {enemyTotal.toLocaleString()} ml
                      </span>
                      <span>{new Date(b.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      won
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {won ? 'THẮNG' : 'THUA'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ClubRankings />

      <AnimatePresence>
        {showChallenge && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChallenge(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-black text-lg flex items-center gap-2">
                  <Swords size={20} className="text-purple-400" /> {t('club.challenge_btn')}
                </h3>
                <button
                  onClick={() => setShowChallenge(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">
                    {t('club.choose_opponent')}
                  </label>
                  <div className="mt-1 max-h-40 overflow-y-auto space-y-1">
                    {allClubs.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedOpponent(c.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all ${
                          selectedOpponent === c.id
                            ? 'bg-purple-500/20 border border-purple-500/40 text-white'
                            : 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Users size={12} /> {c.member_count}
                        </span>
                      </button>
                    ))}
                    {allClubs.length === 0 && (
                      <p className="text-slate-500 text-sm text-center py-4">
                        {t('common.no_results')}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">
                    {t('club.goal_ml_label')}
                  </label>
                  <input
                    type="number"
                    value={targetMl}
                    onChange={(e) => setTargetMl(Number(e.target.value))}
                    min={1000}
                    step={1000}
                    className="w-full mt-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">
                    {t('club.bet_coins')}
                  </label>
                  <input
                    type="number"
                    value={stakeCoins}
                    onChange={(e) => setStakeCoins(Number(e.target.value))}
                    min={0}
                    step={100}
                    className="w-full mt-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>

                <button
                  onClick={handleSendChallenge}
                  disabled={createBattle.isPending}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm shadow-xl active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createBattle.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Swords size={16} />
                  )}
                  {t('club.send_challenge')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveBattleCard({
  battle,
  clubId,
  userId,
  isAdmin,
  now,
  onAccept,
  onContribute,
}: {
  battle: NonNullable<ReturnType<typeof useClubBattles>['activeBattle']>;
  clubId: string;
  userId: string;
  isAdmin: boolean;
  now: number;
  onAccept: () => void;
  onContribute: (amount: number) => void;
}) {
  const isChallenger = battle.challenger_club_id === clubId;
  const isPending = battle.status === 'pending';
  const isParticipant = isChallenger || battle.opponent_club_id === clubId;

  const allyName = isChallenger ? battle.challenger_name : battle.opponent_name;
  const enemyName = isChallenger ? battle.opponent_name : battle.challenger_name;
  const allyTotal = isChallenger ? battle.challenger_total : battle.opponent_total;
  const enemyTotal = isChallenger ? battle.opponent_total : battle.challenger_total;

  const allyPercent = Math.min((allyTotal / battle.target_ml) * 100, 100);
  const enemyPercent = Math.min((enemyTotal / battle.target_ml) * 100, 100);

  const deadline = battle.deadline ? new Date(battle.deadline) : null;
  const remaining = deadline ? Math.max(0, deadline.getTime() - now) : 0;
  const hoursLeft = Math.floor(remaining / 3600000);
  const minutesLeft = Math.floor((remaining % 3600000) / 60000);
  const secondsLeft = Math.floor((remaining % 60000) / 1000);

  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (battle.status !== 'active') return;
    supabase
      .from('club_battle_participants')
      .select('user_id, total_water')
      .eq('battle_id', battle.id)
      .order('total_water', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data) return;
        const uids = data.map((p: { user_id: string }) => p.user_id);
        if (uids.length === 0) return;
        supabase
          .from('public_profiles')
          .select('id, nickname')
          .in('id', uids)
          .then(({ data: profiles }) => {
            const profileMap = new Map((profiles ?? []).map((p: { id: string; nickname: string }) => [p.id, p.nickname]));
            setParticipants(
              (data as { user_id: string; total_water: number }[]).map((p) => ({
                ...p,
                  nickname: profileMap.get(p.user_id) || t('club.anonymous'),
              }))
            );
          });
      });
  }, [battle.id, battle.status]);

  return (
    <div className="bg-slate-900/50 border border-purple-500/20 rounded-3xl p-5 shadow-lg overflow-hidden relative">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 blur-[60px] rounded-full" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Swords size={18} className="text-purple-400" /> {t('club.battlefield')}
        </h3>
        {isPending ? (
          <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30 font-bold flex items-center gap-1">
            <Clock size={12} /> {t('club.waiting_acceptance')}
          </span>
        ) : deadline && remaining > 0 ? (
          <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-lg font-mono flex items-center gap-1">
            <Clock size={12} /> {hoursLeft.toString().padStart(2, '0')}:{minutesLeft.toString().padStart(2, '0')}:{secondsLeft.toString().padStart(2, '0')}
          </span>
        ) : null}
      </div>

      {/* VS Progress */}
      <div className="space-y-3 relative z-10">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300 font-semibold">{enemyName}</span>
            <span className="text-red-400 font-mono text-xs">
              {enemyTotal.toLocaleString()} ml
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-1000"
              style={{ width: `${enemyPercent}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-purple-500/50 flex items-center justify-center">
            <Swords size={14} className="text-purple-400" />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white font-semibold">{allyName}</span>
            <span className="text-cyan-400 font-mono text-xs">
              {allyTotal.toLocaleString()} ml
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${allyPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 mt-3 relative z-10">
        {t('club.goal_label', { ml: battle.target_ml.toLocaleString() })}
      </div>

      {/* Top Contributors */}
      {participants.length > 0 && battle.status === 'active' && (
        <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <Users size={10} /> {t('club.top_contributors')}
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
            {participants.slice(0, 5).map((p, i) => (
              <div key={p.user_id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-slate-500 font-mono w-4 shrink-0">#{i + 1}</span>
                  <span className="text-slate-300 truncate">{p.nickname || t('club.anonymous')}</span>
                  {p.user_id === userId && (
                    <span className="text-[8px] text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded">{t('common.you')}</span>
                  )}
                </div>
                <span className="text-cyan-400 font-mono shrink-0">{p.total_water.toLocaleString()} ml</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-3 relative z-10">
        {isPending && isAdmin && battle.opponent_club_id === clubId ? (
          <button
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check size={16} /> {t('club.accept_challenge')}
          </button>
        ) : isParticipant && battle.status === 'active' ? (
          <ContributeButton userId={userId} onContribute={onContribute} />
        ) : null}

        {isPending && isAdmin && battle.challenger_club_id === clubId && (
          <div className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 text-sm font-bold text-center">
            {t('club.waiting_acceptance')}
          </div>
        )}
      </div>
    </div>
  );
}

function ContributeButton({
  userId,
  onContribute,
}: {
  userId: string;
  onContribute: (amount: number) => void;
}) {
  const { t } = useTranslation();
  const [contributing, setContributing] = useState(false);

  const handleClick = async () => {
    setContributing(true);
    const { data: todayTotal } = await supabase
      .from('water_logs')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', new Date().toISOString().split('T')[0])
      .lte('created_at', new Date().toISOString().split('T')[0] + 'T23:59:59.999Z');

    const total = (todayTotal ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
    if (total <= 0) {
      toast.error(t('club.no_water_today'));
      setContributing(false);
      return;
    }
    onContribute(total);
    setContributing(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={contributing}
      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {contributing ? <Loader2 size={16} className="animate-spin" /> : <Flame size={16} />}
      {t('club.contribute_water_today')}
    </button>
  );
}

function ClubRankings() {
  const [rankings, setRankings] = useState<Array<{ id: string; name: string; battle_wins: number; battle_losses: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('clubs')
      .select('id, name, battle_wins, battle_losses')
      .order('battle_wins', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setRankings(data as typeof rankings);
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  const sorted = [...rankings].sort(
    (a, b) => (b.battle_wins - b.battle_losses) - (a.battle_wins - a.battle_losses)
  );

  return (
    <div className="space-y-3">
      <h3 className="text-white font-bold flex items-center gap-2">
        <Medal className="text-amber-400" size={18} />
        {t('club.battle_rankings')}
      </h3>
      <div className="space-y-2">
        {sorted.map((c, i) => {
          const total = c.battle_wins + c.battle_losses;
          const ratio = total > 0 ? ((c.battle_wins / total) * 100).toFixed(0) : '-';
          const rankStyle =
            i === 0
              ? 'bg-yellow-500/10 border border-yellow-500/30'
              : i === 1
              ? 'bg-slate-300/10 border border-slate-300/20'
              : i === 2
              ? 'bg-orange-500/10 border border-orange-500/20'
              : 'bg-white/5 border border-white/5';

          const rankIcon =
            i === 0 ? (
              <Trophy size={16} className="text-yellow-400" />
            ) : i === 1 ? (
              <Medal size={16} className="text-slate-300" />
            ) : i === 2 ? (
              <Medal size={16} className="text-orange-400" />
            ) : (
              <span className="text-slate-500 font-bold text-xs w-4 text-center">
                {i + 1}
              </span>
            );

          return (
            <div
              key={c.id}
              className={`flex items-center justify-between p-3 rounded-xl ${rankStyle}`}
            >
              <div className="flex items-center gap-3">
                {rankIcon}
                <span className="text-white font-semibold text-sm">{c.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-400 font-bold">{c.battle_wins}W</span>
                <span className="text-red-400 font-bold">{c.battle_losses}L</span>
                <span className="text-slate-500 font-mono">{ratio}%</span>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center p-6 rounded-2xl bg-white/5 text-slate-400 text-sm">
            {t('common.no_results')}
          </div>
        )}
      </div>
    </div>
  );
}
