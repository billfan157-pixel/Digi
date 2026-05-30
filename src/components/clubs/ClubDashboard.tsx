import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FormEvent } from 'react';
import { supabase } from "../../lib/supabase";
import { fetchActiveChallenge, fetchChallengeProgress, createChallenge, type ClubChallenge, type ChallengeProgress } from "../../lib/clubChallenges";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Droplets,
  Crown,
  Medal,
  Loader2,
  ChevronLeft,
  MessageSquare,
  LayoutDashboard,
  ShieldAlert,
  MoreVertical,
  Shield,
  User,
  XCircle,
  History,
  Edit2,
  X,
  AlertTriangle,
  Swords
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ClubChat from "./ClubChat";
import ClubWar from "./ClubWar";

interface Club {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  min_level_required: number;
  member_count?: number;
  total_wp?: number;
}

interface Leader {
  user_id: string;
  role: string;
  club_id: string;
  joined_at: string;
  profiles?: {
    nickname?: string;
    avatar_url?: string;
  };
}

interface Activity {
  id: string;
  message: string;
  amount: number;
  created_at: string;
  profiles?: {
    nickname?: string;
  };
}

interface AdminLog {
  id: string;
  created_at: string;
  action: string;
}

export default function ClubDashboard({
  clubId,
  userId, // THÊM PROP NÀY ĐỂ TRUYỀN CHO CHAT
  onBack,
}: {
  clubId: string;
  userId: string; // THÊM PROP NÀY
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [club, setClub] = useState<Club | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDisbanding, setIsDisbanding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [managingMember, setManagingMember] = useState<Leader | null>(null);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [clubLevel, setClubLevel] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClubMinLevel, setEditingClubMinLevel] = useState(1);
  const [editingClubName, setEditingClubName] = useState("");
  const [editingClubDesc, setEditingClubDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // STATE CHUYỂN TAB
  const [tab, setTab] = useState<'overview' | 'chat' | 'war' | 'admin'>('overview');

  const [challenge, setChallenge] = useState<ClubChallenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<ChallengeProgress | null>(null);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeTargetMl, setChallengeTargetMl] = useState(100000);
  const [challengeDays, setChallengeDays] = useState(7);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  const handleOpenEditModal = () => {
    setEditingClubName(club?.name ?? "");
    setEditingClubDesc(club?.description ?? "");
    setEditingClubMinLevel(club?.min_level_required ?? 1);
    setShowEditModal(true);
  };

  const handleSetRole = async (userId: string, role: 'deputy' | 'member') => {
    const { error } = await supabase
      .from('club_members')
      .update({ role })
      .eq('user_id', userId)
      .eq('club_id', clubId);
    if (error) {
      toast.error(t('club.failed_role'));
    } else {
      toast.success(t('club.role_updated'));
      fetchDashboard();
    }
  };

  const handleKickMember = async (userId: string, nickname: string) => {
    if (!window.confirm(`Are you sure you want to remove ${nickname || 'member'} from the guild?`)) return;
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId);
    if (error) {
      toast.error(t('club.failed_remove'));
    } else {
      toast.success(t('club.member_removed'));
      fetchDashboard();
    }
  };

  const handleUpdateClub = async (e: FormEvent) => {
    e.preventDefault();
    if (!club) return;
    setIsUpdating(true);
    const { error } = await supabase
      .from('clubs')
      .update({
        name: editingClubName,
        description: editingClubDesc,
        min_level_required: editingClubMinLevel,
      })
      .eq('id', club.id);
    setIsUpdating(false);
    if (error) {
      toast.error(t('club.failed_update'));
    } else {
      toast.success(t('club.updated'));
      setClub({ ...club, name: editingClubName, description: editingClubDesc, min_level_required: editingClubMinLevel });
      setShowEditModal(false);
    }
  };

  const handleDisbandClub = async () => {
    if (!club) return;
    if (!window.confirm('Are you sure you want to disband the guild? This cannot be undone.')) return;
    setIsDisbanding(true);
    const { error } = await supabase.from('clubs').delete().eq('id', club.id);
    setIsDisbanding(false);
    if (error) {
      toast.error(t('club.failed_disband'));
    } else {
      toast.success(t('club.disbanded'));
      onBack();
    }
  };

  const currentUserRole = useMemo(() => {
    return leaders.find(l => l.user_id === userId)?.role;
  }, [leaders, userId]);

  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'deputy';

  const goal = challenge?.target_ml ?? 100000;

  const totalMl = challengeProgress?.total_ml ?? 0;

  const progress = Math.min((totalMl / goal) * 100, 100);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Sử dụng Promise.allSettled để tất cả các API đều chạy, kể cả khi một trong số chúng lỗi
      const results = await Promise.allSettled([
        supabase.from("clubs").select("id,name,description,owner_id,min_level_required,member_count,total_wp").eq("id", clubId).maybeSingle(),
        supabase.from('club_members').select('user_id, role, club_id, joined_at, profiles:public_profiles!club_members_user_public_profile_fkey(nickname, avatar_url)').eq('club_id', clubId).order('joined_at', { ascending: false }).limit(50),
        supabase.from("club_activity").select(`id, message, amount, created_at, profiles:public_profiles!club_activity_user_public_profile_fkey (nickname)`).eq("club_id", clubId).order("created_at", { ascending: false }).limit(20),
        supabase.from('club_admin_logs').select(`id, created_at, action`).eq('club_id', clubId).order('created_at', { ascending: false }).limit(50),
        supabase.rpc('get_club_level', { p_club_id: clubId })
      ]);

      // Xử lý từng kết quả một cách an toàn
      if (results[0].status === 'fulfilled' && results[0].value.data) {
        setClub(results[0].value.data);
      } else {
        if (results[0].status === 'rejected') {
          console.error("Error fetching club info:", results[0].reason);
        }
        // Throw a user-friendly error if club is not found or access is denied
        throw new Error("Cannot load guild info. The guild may not exist or you don't have access.");
      }

      if (results[1].status === 'fulfilled' && results[1].value.data) {
        setLeaders(results[1].value.data as Leader[]);
      } else {
        console.error("Error fetching leaders:", results[1].status === 'rejected' && results[1].reason);
        setLeaders([]); // Fallback
      }

      if (results[2].status === 'fulfilled' && results[2].value.data) {
        setActivities(results[2].value.data as Activity[] || []);
      } else {
        console.error("Error fetching activities:", results[2].status === 'rejected' && results[2].reason);
        setActivities([]); // Fallback
      }

      if (results[3].status === 'fulfilled' && results[3].value.data) {
        setAdminLogs(results[3].value.data as AdminLog[]);
      } else {
        console.warn("Could not fetch admin logs. The table might not exist yet.", results[3].status === 'rejected' && results[3].reason);
        setAdminLogs([]); // Fallback
      }

      if (results[4].status === 'fulfilled' && results[4].value.data) {
        setClubLevel(results[4].value.data);
      } else {
        console.warn("Could not fetch club level. The RPC might not exist yet.", results[4].status === 'rejected' && results[4].reason);
        setClubLevel(1); // Fallback
      }

      const activeChallenge = await fetchActiveChallenge(clubId);
      setChallenge(activeChallenge);
      if (activeChallenge) {
        const progress = await fetchChallengeProgress(clubId, activeChallenge.start_date, activeChallenge.end_date);
        setChallengeProgress(progress);
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('club.load_error'));
    } finally {
      setLoading(false);
    }
  }, [clubId, t]);

  useEffect(() => {
    if (!clubId) return;
    fetchDashboard();

    const channel = supabase.channel(`club-${clubId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "club_activity",
          filter: `club_id=eq.${clubId}`,
        },
        () => {
          fetchDashboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "club_admin_logs",
          filter: `club_id=eq.${clubId}`,
        },
        () => {
          fetchDashboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId, fetchDashboard]);

  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-yellow-500/10 border border-yellow-500/30";
    if (index === 1) return "bg-slate-300/10 border border-slate-300/20";
    if (index === 2) return "bg-orange-500/10 border border-orange-500/20";
    return "bg-white/5 border border-white/5";
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="text-yellow-400" size={18} />;
    if (index === 1) return <Medal className="text-slate-300" size={18} />;
    if (index === 2) return <Medal className="text-orange-400" size={18} />;
    return <span className="text-slate-500 font-bold">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
        <p className="text-slate-500 mt-3 text-sm">{t('club.loading_guild_data')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
        <AlertTriangle size={40} className="text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">{t('club.load_error_title')}</h3>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <button onClick={onBack} className="px-6 py-2 bg-white/10 text-white rounded-lg font-semibold">{t('common.back')}</button>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-white/5 p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white/5 text-white active:scale-95 transition-transform"
        >
          <ChevronLeft size={18} />
        </button>

        <h2 className="text-white font-bold">
          {club?.name || t('common.loading_data')}
        </h2>

        <div className="ml-3 flex items-center gap-1.5 text-cyan-400 text-xs font-bold bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20">
          <Shield size={14} /> {t('club.guild_level', { level: clubLevel })}
        </div>

        {userId === club?.owner_id && (
          <button
            onClick={handleOpenEditModal}
            className="ml-auto p-2 rounded-xl bg-white/5 text-slate-400 hover:text-cyan-400 active:scale-95 transition-all"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Club Info Header - LUÔN LUÔN HIỂN THỊ */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 shadow-lg">
          <h2 className="text-white text-xl font-black">{club?.name}</h2>
          <p className="text-slate-400 text-sm mt-1">
            {club?.description || t('club.no_description')}
          </p>

          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>{t('club.guild_progress')}</span>
              <span className="font-bold text-cyan-400">
                {totalMl.toLocaleString()} / {goal.toLocaleString()} ml
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {challenge && (
            <div className="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
                <Trophy size={14} />
                {t('club.challenge_label', { title: challenge.title })}
                <span className="text-amber-500/60 font-normal">
                  ({new Date(challenge.start_date).toLocaleDateString('vi-VN')} - {new Date(challenge.end_date).toLocaleDateString('vi-VN')})
                </span>
              </div>
              {challengeProgress && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {t('club.members_joined', { count: challengeProgress.member_count, percent: Math.round(progress) })}
                  ({totalMl.toLocaleString()}/{goal.toLocaleString()} ml)
                </p>
              )}
            </div>
          )}

          {isAdmin && !challenge && (
            <button
              onClick={() => setShowCreateChallenge(true)}
              className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 text-amber-400 text-xs font-bold hover:from-amber-600/30 hover:to-orange-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Trophy size={14} /> {t('club.create_guild_challenge')}
            </button>
          )}
        </div>

        {/* BỘ NÚT CHUYỂN TAB */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setTab('overview')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              tab === 'overview' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} /> {t('club.tab_overview')}
          </button>
          <button
            onClick={() => setTab('chat')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              tab === 'chat' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={18} /> {t('club.tab_chat')}
          </button>
          <button
            onClick={() => setTab('war')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              tab === 'war' ? 'bg-purple-500/80 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords size={18} /> {t('club.tab_war')}
          </button>
          {isAdmin && (
            <button
              onClick={() => setTab('admin')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                tab === 'admin' ? 'bg-red-500/80 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield size={18} /> {t('club.admin')}
            </button>
          )}
        </div>

        {/* NỘI DUNG TÙY THEO TAB ĐƯỢC CHỌN */}
        {tab === 'overview' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Leaderboard */}
            <div className="space-y-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Trophy className="text-yellow-400" size={18} />
                {t('club.leaderboard_today')}
              </h3>

              {leaders.length === 0 ? (
                <div className="text-center p-6 rounded-2xl bg-white/5 text-slate-400 text-sm">
                  {t('club.no_activity')}
                </div>
              ) : (
                leaders.map((user, index) => (
                  <div
                    key={user.user_id}
                    className={`flex items-center justify-between p-4 rounded-2xl ${getRankStyle(index)}`}
                  >
                    <div className="flex items-center gap-3">
                      {getRankIcon(index)}
                      <div>
                        <p className="text-white font-semibold flex items-center gap-2">
                          {user.profiles?.nickname || t('club.anonymous')}
                          {user.role === 'owner' && <Crown size={14} className="text-yellow-400" />}
                          {user.role === 'deputy' && <Shield size={14} className="text-cyan-400" />}
                        </p>
                        <p className="text-xs text-cyan-400 font-medium">
                          {user.role === 'owner' ? t('club.role_leader') : user.role === 'deputy' ? t('club.role_vice') : t('club.role_member')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Flame className="text-yellow-400 animate-pulse" size={18} />
                      )}
                      {isAdmin && user.user_id !== userId && !(currentUserRole === 'deputy' && user.role !== 'member') && (
                        <button onClick={() => setManagingMember(user)} className="p-2 rounded-full hover:bg-white/10 text-slate-500">
                          <MoreVertical size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Activity Feed */}
            <div className="space-y-3 pb-10">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Droplets className="text-cyan-400" size={18} />
                {t('club.recent_activities')}
              </h3>

              <div className="space-y-2">
                {activities.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col"
                  >
                    <p className="text-sm text-white">
                      <span className="font-semibold text-cyan-400">
                        {item.profiles?.nickname || t('club.someone')}
                      </span>{" "}
                      {item.message}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-1 self-end">
                      {new Date(item.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : tab === 'chat' ? (
          /* TAB TRÒ CHUYỆN (CLUB CHAT) */
          <div className="h-[60vh] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ClubChat clubId={clubId} userId={userId} />
          </div>
        ) : tab === 'war' ? (
          /* TAB CHIẾN TRANH */
          <ClubWar clubId={clubId} userId={userId} isAdmin={isAdmin} />
        ) : (
          /* TAB QUẢN TRỊ */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <History className="text-slate-400" size={18} />
                {t('club.admin_logs')}
              </h3>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                {adminLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-900/40 border border-white/5 text-sm">
                    <span className="font-bold text-cyan-400">{t('club.system')}</span>
                    <span className="text-slate-300"> {log.action}</span>
                    <p className="text-[10px] text-slate-500 mt-1 text-right">{new Date(log.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* KHU VỰC NGUY HIỂM CHO CHỦ BANG */}
            {userId === club?.owner_id && (
              <div className="mt-8 pt-6 border-t border-red-500/20">
                <h3 className="text-red-400 font-bold text-center mb-3 text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                  <ShieldAlert size={16} /> {t('club.danger_zone')}
                </h3>
                <button
                  onClick={handleDisbandClub}
                  disabled={isDisbanding}
                  className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDisbanding ? <Loader2 className="animate-spin" /> : t('club.disband_guild')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {managingMember && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setManagingMember(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative z-10 w-full max-w-md bg-slate-900 border-t border-white/10 rounded-t-3xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-2">{t('club.manage_members')}</h3>
              <p className="text-slate-400 mb-6">You are managing: <span className="font-bold text-cyan-400">{managingMember.profiles?.nickname}</span></p>
              
              <div className="space-y-3">
                {managingMember.role !== 'deputy' && (
                  <button onClick={() => handleSetRole(managingMember.user_id, 'deputy')} className="w-full p-4 rounded-xl bg-cyan-500/10 text-cyan-400 font-bold flex items-center gap-3 hover:bg-cyan-500/20 transition-colors">
                    <Shield size={18} /> {t('club.promote_to_vice')}
                  </button>
                )}
                {managingMember.role === 'deputy' && (
                  <button onClick={() => handleSetRole(managingMember.user_id, 'member')} className="w-full p-4 rounded-xl bg-amber-500/10 text-amber-400 font-bold flex items-center gap-3 hover:bg-amber-500/20 transition-colors">
                    <User size={18} /> {t('club.demote_to_member')}
                  </button>
                )}
                <button onClick={() => handleKickMember(managingMember.user_id, managingMember.profiles?.nickname || t('club.this_member'))} className="w-full p-4 rounded-xl bg-red-500/10 text-red-400 font-bold flex items-center gap-3 hover:bg-red-500/20 transition-colors">
                  <XCircle size={18} /> {t('club.kick_member')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Create Challenge Modal */}
      <AnimatePresence>
        {showCreateChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateChallenge(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-black text-lg">{t('club.create_challenge')}</h3>
                <button onClick={() => setShowCreateChallenge(false)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t('club.challenge_name_input')}</label>
                  <input
                    value={challengeTitle}
                    onChange={(e) => setChallengeTitle(e.target.value)}
                    placeholder={t('common.challenge_name_placeholder')}
                    className="w-full mt-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t('club.goal_ml')}</label>
                  <input
                    type="number"
                    value={challengeTargetMl}
                    onChange={(e) => setChallengeTargetMl(Number(e.target.value))}
                    min={1000}
                    step={1000}
                    className="w-full mt-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t('club.duration_days')}</label>
                  <div className="flex gap-2 mt-1">
                    {[3, 7, 14].map(d => (
                      <button
                        key={d}
                        onClick={() => setChallengeDays(d)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          challengeDays === d ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {d} {t('club.days_unit')}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!challengeTitle.trim() || challengeTargetMl < 1000) {
                      toast.error(t('club.invalid_name_goal'));
                      return;
                    }
                    setIsCreatingChallenge(true);
                    const result = await createChallenge({
                      clubId,
                      userId,
                      title: challengeTitle.trim(),
                      targetMl: challengeTargetMl,
                      durationDays: challengeDays,
                    });
                    setIsCreatingChallenge(false);
                    if (result) {
                      toast.success(t('club.challenge_created'));
                      setShowCreateChallenge(false);
                      setChallengeTitle('');
                      setChallengeTargetMl(100000);
                      setChallengeDays(7);
                      fetchDashboard();
                    } else {
                      toast.error(t('club.failed_challenge'));
                    }
                  }}
                  disabled={isCreatingChallenge}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm shadow-xl active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  {isCreatingChallenge ? t('club.creating') : t('club.create_challenge')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showEditModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.form
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onSubmit={handleUpdateClub}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-7 rounded-[2.5rem] shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-white font-black text-xl">{t('club.edit_guild')}</h2>
                <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t('club.guild_name_input')}</label>
                  <input
                    value={editingClubName}
                    onChange={(e) => setEditingClubName(e.target.value)}
                    maxLength={50}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t('club.slogan_desc')}</label>
                  <textarea
                    value={editingClubDesc}
                    onChange={(e) => setEditingClubDesc(e.target.value)}
                    maxLength={200}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white h-28 resize-none outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t('club.required_level')}</label>
                    <span className="font-bold text-cyan-400">Lv.{editingClubMinLevel}</span>
                  </div>
                  <input
                    type="range" min="1" max="100"
                    value={editingClubMinLevel}
                    onChange={(e) => setEditingClubMinLevel(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
              <button type="submit" disabled={isUpdating} className="w-full py-4 rounded-xl bg-cyan-500 text-black font-black text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform disabled:opacity-50">
                {isUpdating ? <Loader2 className="animate-spin mx-auto" /> : t('club.save_changes_btn')}
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
