import React from 'react';
import { Activity, Camera, Clock3, Droplets, Flame, Send, Swords, X } from 'lucide-react';

import HistoryModal from './HistoryModal';
import SmartHubModal from './SmartHubModal';
import AiChatModal from './AiChatModal';
import { useModalStore } from '../../store/useModalStore';
import { useAppStore } from '../../store/useAppStore';
import { useAiSocial } from '../../context/AiSocialContext';

const UpgradeModal = React.lazy(() => import('./UpgradeModal'));
const LevelUpModal = React.lazy(() => import('../clubs/LevelUpModal'));
const ShopModal = React.lazy(() => import('./ShopModal'));
const BattleArenaModal = React.lazy(() => import('./BattleArenaModal'));
const QuestModal = React.lazy(() => import('./QuestModal'));
const EditEntryModal = React.lazy(() => import('./EditEntryModal'));
const FastingModal = React.lazy(() => import('./FastingModal'));
const SettingsModal = React.lazy(() => import('./SettingsModal'));
const ClubCoopModal = React.lazy(() => import('./ClubCoopModal'));
const ConfirmDialog = React.lazy(() => import('../ui/ConfirmDialog'));
const SocialDiscoverModal = React.lazy(() => import('./SocialDiscoverModal'));
const CommentsView = React.lazy(() => import('../../tabs/Feed/CommentsView').then(m => ({ default: m.CommentsView })));

export default function GlobalModalManager() {
  const { 
    showSocialComposer, setShowSocialComposer, 
    showHistory, setShowHistory,
    activeCommentPost, setActiveCommentPost 
  } = useModalStore();

  const profile = useAppStore(s => s.profile);
  const isPremium = useAppStore(s => s.isPremium);
  const waterEntries = useAppStore(s => s.waterEntries);
  const waterIntake = useAppStore(s => s.waterIntake);
  const waterGoal = useAppStore(s => s.waterGoal);
  const streak = useAppStore(s => s.streak);
  const weatherData = useAppStore(s => s.weatherData);
  const watchData = useAppStore(s => s.watchData);
  const isWeatherSynced = useAppStore(s => s.isWeatherSynced);
  const isWatchConnected = useAppStore(s => s.isWatchConnected);
  
  const setEditingEntry = useModalStore(s => s.setEditingEntry);
  const setEditAmount = useModalStore(s => s.setEditAmount);
  const handleDeleteEntry = useAppStore(s => s.actions.handleDeleteEntry);

  const { geminiProps, socialProps } = useAiSocial();
  const { chatMessages, isChatLoading, chatInput, setChatInput, handleSendChatMessage } = geminiProps;
  const {
    socialComposer,
    setSocialComposer,
    showDiscoverPeople,
    setShowDiscoverPeople,
    socialSearchQuery,
    handleSearchSocialUsers,
    isSocialSearching,
    socialSearchResults,
    handleUnfollowUser,
    handleFollowUser,
    handlePublishSocialPost,
    socialImageInputRef,
    handleSocialImagePicked,
    socialImagePreview,
    setSocialImagePreview,
    setSocialImageFile,
  } = socialProps;
  const isDropComposer = socialComposer.postKind === 'story';
  const isDuelComposer = socialComposer.postKind === 'challenge';
  const progressPercent = Math.min(100, Math.round((waterIntake / Math.max(waterGoal, 1)) * 100));
  const socialComposerTitle = isDropComposer ? 'Tạo Drop' : isDuelComposer ? 'Tạo Duel' : 'Tạo Pulse';
  const socialComposerPlaceholder = isDropComposer
    ? 'Caption thật ngắn cho khoảnh khắc này...'
    : isDuelComposer
      ? 'VD: Ai hoàn thành 2 lít trước 17:00?'
      : 'Viết cập nhật ngắn về tiến độ hôm nay...';
  const composerPresets = isDropComposer
    ? ['Vừa bù nước xong.', 'Ly này cứu cả buổi chiều.', 'Drop nhanh trước khi quay lại việc.']
    : isDuelComposer
      ? ['Đua 2 lít trước 17:00 không?', 'Ai giữ chuỗi 7 ngày cùng mình?', 'Kèo uống đủ nước hôm nay.']
      : [`Đã đạt ${progressPercent}% mục tiêu hôm nay.`, 'Cần thêm một nhịp nhắc nước.', 'Vừa bù nước sau vận động.'];

  // Lớp nền mờ đặc trưng Cyberpunk
  const modalOverlay = "fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300";
  const modalContent = "w-full max-w-md bg-slate-950 border border-white/10 rounded-t-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300";

  return (
    <>
      <HistoryModal 
        showHistory={showHistory} 
        setShowHistory={setShowHistory} 
        waterEntries={waterEntries} 
        waterIntake={waterIntake} 
        setEditingEntry={setEditingEntry} 
        setEditAmount={setEditAmount} 
        handleDeleteEntry={handleDeleteEntry} 
      />
      <SmartHubModal weatherData={weatherData} watchData={watchData} isWeatherSynced={isWeatherSynced} isWatchConnected={isWatchConnected} />
      <AiChatModal />

      {/* 4. MODAL SOCIAL COMPOSER (Đăng bài) */}
      {showSocialComposer && (
        <div className={modalOverlay}>
           <div className={modalContent}>
              <form onSubmit={handlePublishSocialPost} className="max-h-[92vh] overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] scrollbar-hide">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                      isDropComposer
                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                        : isDuelComposer
                          ? 'border-purple-500/25 bg-purple-500/10 text-purple-300'
                          : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300'
                    }`}>
                      {isDropComposer ? <Droplets size={20} /> : isDuelComposer ? <Swords size={20} /> : <Activity size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${
                        isDropComposer ? 'text-emerald-300' : isDuelComposer ? 'text-purple-300' : 'text-cyan-300'
                      }`}>
                        {isDropComposer ? 'Drop 24 giờ' : isDuelComposer ? 'Duel' : 'Pulse'}
                      </p>
                      <h3 className="truncate text-lg font-black text-white">{socialComposerTitle}</h3>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowSocialComposer(false)} className="rounded-full bg-white/5 p-2 text-slate-400 transition-all hover:bg-white/10 active:scale-95">
                    <X size={18} />
                  </button>
                </div>

                {isDropComposer ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => socialImageInputRef.current?.click()}
                      className="relative flex aspect-[9/13] max-h-[420px] w-full items-center justify-center overflow-hidden rounded-[1.5rem] border border-emerald-500/20 bg-slate-900 active:scale-[0.99] transition-all"
                    >
                      {socialImagePreview ? (
                        <img src={socialImagePreview} alt="Ảnh Drop xem trước" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center px-8 text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                            <Camera size={26} />
                          </div>
                          <p className="text-base font-black text-white">Chạm để thêm ảnh Drop</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">Dạng story dọc, biến mất sau 24 giờ.</p>
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-[10px] font-black text-white backdrop-blur-md">
                        <Clock3 size={12} />
                        24 giờ
                      </div>
                    </button>
                    <textarea
                      value={socialComposer.content}
                      onChange={(e) => setSocialComposer((prev) => ({ ...prev, content: e.target.value }))}
                      rows={3}
                      maxLength={90}
                      placeholder={socialComposerPlaceholder}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/40"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`rounded-2xl border p-4 ${
                      isDuelComposer ? 'border-purple-500/20 bg-purple-500/5' : 'border-cyan-500/15 bg-cyan-500/5'
                    }`}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-xs font-bold text-cyan-300"><Droplets size={15} />{waterIntake}/{waterGoal}ml</span>
                        <span className="flex items-center gap-2 text-xs font-bold text-orange-300"><Flame size={15} />Chuỗi {streak} ngày</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                    <textarea
                      value={socialComposer.content}
                      onChange={(e) => setSocialComposer((prev) => ({ ...prev, content: e.target.value }))}
                      rows={5}
                      maxLength={isDuelComposer ? 120 : 140}
                      placeholder={socialComposerPlaceholder}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/40"
                    />
                    {socialImagePreview && (
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                        <img src={socialImagePreview} alt="Ảnh xem trước" className="max-h-60 w-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {composerPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSocialComposer((prev) => ({ ...prev, content: preset }))}
                      className="shrink-0 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-[10px] font-bold text-slate-300 transition-all hover:border-cyan-500/30 hover:text-cyan-300 active:scale-95"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input ref={socialImageInputRef} type="file" accept="image/*" onChange={handleSocialImagePicked} className="hidden" />

                {!isDropComposer && (
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => socialImageInputRef.current?.click()} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-xs font-bold text-cyan-300 active:scale-95 transition-all">
                      <Camera size={16} />
                      Thêm ảnh
                    </button>
                    <select
                      value={socialComposer.visibility}
                      onChange={(e) => setSocialComposer((prev) => ({ ...prev, visibility: e.target.value as typeof prev.visibility }))}
                      className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-xs font-bold text-white outline-none focus:border-cyan-500/40"
                    >
                      <option value="followers">Vòng gần</option>
                      <option value="public">Công khai</option>
                    </select>
                  </div>
                )}

                {socialImagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setSocialImageFile(null);
                      if (socialImagePreview.startsWith('blob:')) URL.revokeObjectURL(socialImagePreview);
                      setSocialImagePreview('');
                    }}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-300 active:scale-95 transition-all"
                  >
                    Xóa ảnh đã chọn
                  </button>
                )}

                <button type="submit" className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-slate-950 shadow-lg active:scale-[0.99] transition-all ${
                  isDropComposer ? 'bg-emerald-400 shadow-emerald-500/15' : isDuelComposer ? 'bg-purple-400 shadow-purple-500/15' : 'bg-cyan-400 shadow-cyan-500/15'
                }`}>
                  <Send size={17} />
                  {isDropComposer ? 'Đăng Drop 24 giờ' : isDuelComposer ? 'Đăng Duel' : 'Đăng Pulse'}
                </button>
              </form>
           </div>
        </div>
      )}

      {/* OTHER MODALS */}
      <React.Suspense fallback={null}>
        <UpgradeModal />
        <LevelUpModal />
        <ShopModal />
        <BattleArenaModal />
        <ClubCoopModal />
        <FastingModal />
        <QuestModal />
        <SettingsModal />
        <EditEntryModal />
        <ConfirmDialog />
        <SocialDiscoverModal
          showDiscoverPeople={!!showDiscoverPeople}
          setShowDiscoverPeople={setShowDiscoverPeople}
          socialSearchQuery={socialSearchQuery || ''}
          handleSearchSocialUsers={handleSearchSocialUsers || (() => {})}
          isSocialSearching={!!isSocialSearching}
          socialSearchResults={socialSearchResults || []}
          handleUnfollowUser={handleUnfollowUser || (() => {})}
          handleFollowUser={handleFollowUser || (() => {})}
        />
        {activeCommentPost && (
          <CommentsView
            post={activeCommentPost}
            currentUserId={profile?.id}
            onClose={() => setActiveCommentPost(null)}
          />
        )}
      </React.Suspense>
    </>
  );
}
