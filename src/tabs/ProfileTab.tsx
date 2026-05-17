import React, { useState, useMemo, memo } from 'react';
import { Sparkles, Trophy, Zap, UserPlus, Settings, Flame, Lock, BarChart2, Grid, Droplets, Target, Award, Shield, Heart, Crown, Share2 } from 'lucide-react';
import TabHeader from '../components/layout/TabHeader';
import { PostCard } from './FeedTab';
import BadgesGrid from '../components/BadgesGrid';
import { toast } from 'sonner';
import { expRequiredForLevel, totalExpForLevel } from '../config/questConfig';
import AvatarFrame from '../components/AvatarFrame';
import type { SocialFeedPost } from '../models';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import { getRankInfo } from '../utils/healthMath';
import { useShallow } from 'zustand/react/shallow';
import { shareHydrationStats } from '@/lib/share';
import { impact } from '@/lib/haptics';

interface SocialProfileStats {
  followers: number;
  following: number;
  posts: number;
}

interface ProfileTabProps {
  streakFreezes?: number;
  needsFreeze?: boolean;
  onUseStreakFreeze?: () => Promise<boolean>;
  socialProfileStats: SocialProfileStats;
  posts?: SocialFeedPost[];
  handleToggleLikePost?: (post: SocialFeedPost) => void;
  setShowShopModal: (show: boolean) => void;
}

const card = "bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl";
const cardGlow = "bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-3xl shadow-[0_0_20px_rgba(6,182,212,0.15)]";

const ProfileTab = memo(function ProfileTab({
  streakFreezes, needsFreeze, onUseStreakFreeze, socialProfileStats,
  posts, handleToggleLikePost
}: ProfileTabProps) {
  const { profile, isPremium, streak, waterIntake, waterGoal, weeklyHistory, actions: { handleLogout } } = useAppStore(useShallow((state) => ({
    profile: state.profile,
    isPremium: state.isPremium,
    streak: state.streak,
    waterIntake: state.waterIntake,
    waterGoal: state.waterGoal,
    weeklyHistory: state.weeklyHistory,
    actions: state.actions,
  })));
  const { setShowPremiumModal, setShowAddFriend, setShowProfileSettings, setActiveTab, setActiveCommentPost } = useUIStore(useShallow((state) => ({
    setShowPremiumModal: state.setShowPremiumModal,
    setShowAddFriend: state.setShowAddFriend,
    setShowProfileSettings: state.setShowProfileSettings,
    setActiveTab: state.setActiveTab,
    setActiveCommentPost: state.setActiveCommentPost,
  })));
  const wp = profile?.wp || 0;
  const currentRank = getRankInfo(wp);
  const progress = Math.min((waterIntake / (waterGoal || 1)) * 100, 100);
  const completionPercent = Math.round(progress);
  const remainingWater = Math.max(waterGoal - waterIntake, 0);

  const [activeView, setActiveView] = useState<'stats' | 'posts'>('stats');

  const totalWeek = weeklyHistory.reduce((sum, item) => sum + item.ml, 0);
  const avgWeek = Math.round(totalWeek / (weeklyHistory.length || 1));

  const myPosts: SocialFeedPost[] = useMemo(() => {
    return posts?.filter((p) => p.author_id === profile?.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
  }, [posts, profile?.id]);

  return <div className="animate-in slide-in-from-right duration-300 space-y-5 pb-6">
    <TabHeader
      label="THÔNG TIN CÁ NHÂN"
      title={
        <span className="flex items-center gap-3">
          Hồ sơ
          {isPremium && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg flex items-center gap-1">
              <Sparkles size={10} /> PRO
            </span>
          )}
        </span>
      }
      profile={profile}
      actionIcon={<Crown size={18} />}
    />

    <div className={`${cardGlow} overflow-hidden`}>
      <div className="relative p-6">
        <div className="absolute -top-12 -right-8 w-32 h-32 rounded-full blur-3xl bg-cyan-500/15 pointer-events-none" />
        <div className="absolute -bottom-14 -left-10 w-36 h-36 rounded-full blur-3xl bg-amber-500/10 pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 shadow-lg rounded-full">
            <AvatarFrame size="md" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={true} frameId={profile?.equipped_frame_id} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-2xl font-black text-white truncate">{profile?.nickname || 'Khách'}</h3>
                <div className={`w-7 h-7 rounded-xl border flex items-center justify-center flex-shrink-0 ${currentRank.bg} ${currentRank.border}`} title={currentRank.name}>
                  <Trophy size={12} className={currentRank.color} />
                </div>
                <div className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-1" title={`Streak: ${streak} ngày`}>
                  <Zap size={10} className="fill-orange-400 text-orange-400" />
                  <span className="text-orange-400 text-[10px] font-bold">{streak}</span>
                </div>
                {isPremium && streakFreezes !== undefined && <div className={`px-2 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-all ${needsFreeze ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30 animate-pulse' : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'}`} title={needsFreeze ? 'Dùng Streak Freeze để bảo vệ chuỗi!' : `Streak Freeze: ${streakFreezes} lần/tháng`} onClick={needsFreeze ? () => onUseStreakFreeze?.().then((success: boolean) => {
                      if (success) toast.success('🛡️ Đã sử dụng Streak Freeze! Chuỗi của bạn được bảo vệ.');
                    }) : undefined}>
                    <Shield size={10} className={needsFreeze ? 'text-red-400' : 'text-blue-400'} />
                    <span className={`text-[10px] font-bold ${needsFreeze ? 'text-red-400' : 'text-blue-400'}`}>
                      {streakFreezes}
                    </span>
                  </div>}
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="text-center"><p className="text-white font-black text-sm">{socialProfileStats.followers}</p><p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mt-0.5">Follower</p></div>
              <div className="text-center"><p className="text-white font-black text-sm">{socialProfileStats.following}</p><p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mt-0.5">Đang follow</p></div>
              <div className="text-center"><p className="text-white font-black text-sm">{wp}</p><p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mt-0.5">Điểm WP</p></div>
            </div>

            <div className="mt-5">
              {(() => {
                const currentLevel = profile?.level || 1;
                const totalExp = profile?.total_exp || 0;
                // FIX: Chuẩn hóa lại công thức tính toán EXP để đồng bộ trên toàn hệ thống
                const expForCurrentLevelStart = totalExpForLevel(currentLevel);
                const progressExp = totalExp - expForCurrentLevelStart;
                const requiredExp = expRequiredForLevel(currentLevel);
                const progressPercent = requiredExp > 0 ? Math.min((progressExp / requiredExp) * 100, 100) : 0;

                return <>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiến độ cấp độ</span>
                      <span className="text-xs font-black text-cyan-400">
                        LV.{currentLevel} <span className="text-slate-500 text-[10px] font-mono">({progressExp}/{requiredExp})</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000 relative" style={{ width: `${progressPercent}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite] -skew-x-12" />
                      </div>
                    </div>
                  </>;
              })()}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5 relative z-10">
          <button onClick={() => setShowAddFriend(true)} className="flex-1 py-2.5 rounded-full border border-white/20 text-white/80 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 ease-out hover:hover:bg-white/10"><UserPlus size={14} /> Thêm bạn</button>
          <button onClick={() => setShowProfileSettings(true)} className="flex-1 py-2.5 rounded-full border border-white/20 text-white/80 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 ease-out hover:hover:bg-white/10"><Settings size={14} /> Cài đặt</button>
        </div>
      </div>
    </div>

    <div className="flex border-b border-white/10 mb-4 px-2">
      <button onClick={() => setActiveView('stats')} className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${activeView === 'stats' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-400'}`}>
        <BarChart2 size={16} /> Thống kê
        {activeView === 'stats' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-t-full" />}
      </button>
      <button onClick={() => setActiveView('posts')} className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${activeView === 'posts' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}>
        <Grid size={16} /> Bài đăng
        {activeView === 'posts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />}
      </button>
    </div>

    {activeView === 'stats' && <>
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white text-lg font-black">Tiến độ tuần này</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  impact('light');
                  shareHydrationStats({
                    streak,
                    waterIntake,
                    waterGoal,
                    level: profile.level || 1,
                    coins: profile.coins || 0,
                  });
                }}
                className="px-3 py-1.5 rounded-full border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all hover:bg-white/10 flex items-center gap-1"
              >
                <Share2 size={12} /> Chia sẻ
              </button>
              <button onClick={() => setActiveTab('insight')} className="px-4 py-1.5 rounded-full border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all hover:bg-white/10">Chi tiết</button>
            </div>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-24">
            {weeklyHistory.map((item, index) => {
              const pct = Math.min(waterGoal > 0 ? item.ml / waterGoal * 100 : 0, 100);
              return <div key={item.d || `profile-history-item-${index}`} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full rounded-lg relative overflow-hidden bg-slate-900 border border-slate-700/50" style={{ height: '60px' }}>
                    <div className="absolute bottom-0 w-full rounded-lg transition-all duration-700" style={{ height: `${pct}%`, background: item.isToday ? 'linear-gradient(180deg, #06b6d4, #0ea5e9)' : 'rgba(6,182,212,0.2)' }} />
                  </div>
                  <span className="text-[9px] font-bold" style={{ color: item.isToday ? '#0ea5e9' : '#64748b' }}>{item.d}</span>
                </div>;
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">Trung bình: <span className="text-cyan-400">{avgWeek} ml</span></span>
            <span className="text-slate-400">Tổng: <span className="text-cyan-400">{totalWeek} ml</span></span>
          </div>
        </div>

        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-black">Hôm nay</h3>
            <button onClick={() => setActiveTab('feed')} className="px-4 py-1.5 rounded-full border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all hover:hover:bg-white/10">Xem Feed</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <Droplets size={18} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold truncate">Đã uống</p>
                <p className="text-base font-black text-cyan-300 truncate">{waterIntake} ml</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <Flame size={18} className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold truncate">Hoàn thành</p>
                <p className="text-base font-black text-emerald-300 truncate">{completionPercent}%</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                <Target size={18} className="text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold truncate">Còn thiếu</p>
                <p className="text-base font-black text-orange-300 truncate">{remainingWater} ml</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${currentRank.bg} flex items-center justify-center border ${currentRank.border} shrink-0`}>
                <Award size={18} className={currentRank.color} />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold truncate">Hạng</p>
                <p className={`text-base font-black truncate ${currentRank.color}`}>{currentRank.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${card} p-5`}>
          <button className={`w-full flex items-center justify-between p-4 ${card} active:scale-[0.98] transition-all`} onClick={() => setShowProfileSettings(true)}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                <Heart size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Apple Health / Google Fit</p>
                <p className="text-[10px] text-slate-500">Mở Cài đặt để đồng bộ</p>
              </div>
            </div>
          </button>
        </div>

        {!isPremium && (
          <div className={`${card} overflow-hidden relative mt-2 mb-4 group cursor-pointer active:scale-95 transition-all`} onClick={() => setShowPremiumModal(true)}>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-cyan-400/30 transition-all duration-500" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gradient-to-tr from-amber-400/10 to-orange-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-400/20 transition-all duration-500" />
            
            <div className="p-6 relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-amber-400" />
                  <h3 className="text-white text-lg font-black tracking-tight">DigiWell <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">PRO</span></h3>
                </div>
                <p className="text-slate-400 text-xs">Mở khóa AI Coach & Không giới hạn</p>
              </div>
              <button className="px-4 py-2.5 bg-white text-slate-900 rounded-xl font-black text-xs shadow-[0_4px_15px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-all">
                Nâng cấp
              </button>
            </div>
          </div>
        )}

        {profile?.id && <BadgesGrid userId={profile.id} />}

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 mt-2">
            <button onClick={handleLogout} className="w-full py-4 rounded-full border border-red-500/30 text-red-400 text-sm font-bold bg-red-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-red-500/20">
              <Lock size={18} /> Đăng xuất tài khoản
            </button>
          </div>
      </>}

    {activeView === 'posts' && <div className="mt-4 space-y-4">
        {myPosts.length > 0 ? myPosts.map((post, index: number) => <PostCard key={post.id || `mypost-${index}`} post={post} currentUserId={profile?.id} handleToggleLikePost={handleToggleLikePost || (() => {})} onOpenComments={setActiveCommentPost} />) : <div className="text-center py-10 bg-slate-900/50 rounded-3xl border border-white/5">
            <Grid size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Bạn chưa có bài đăng nào</p>
          </div>}
      </div>}
  </div>;
});

export default ProfileTab;
