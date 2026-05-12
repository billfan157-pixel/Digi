import React from 'react';
import { Camera } from 'lucide-react';

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

export default function GlobalModalManager() {
  const { showSocialComposer, setShowSocialComposer, showHistory, setShowHistory } = useModalStore();

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
  const socialComposerTitle = socialComposer.postKind === 'story'
    ? 'Tạo Drop'
    : socialComposer.postKind === 'challenge'
      ? 'Tạo Duel'
      : 'Pulse';
  const socialComposerPlaceholder = socialComposer.postKind === 'story'
    ? 'Viết caption ngắn cho Drop...'
    : socialComposer.postKind === 'challenge'
      ? 'Nhập mục tiêu Duel...'
      : 'Ghi chú ngắn cho Pulse hôm nay...';

  // Lớp nền mờ đặc trưng Cyberpunk
  const modalOverlay = "fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300";
  const modalContent = "w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300";

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
              <form onSubmit={handlePublishSocialPost} className="p-6">
                <h3 className="text-xl font-black text-white mb-4 uppercase">{socialComposerTitle}</h3>
                <textarea 
                  value={socialComposer.content}
                  onChange={(e) => setSocialComposer((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder={socialComposerPlaceholder}
                  className="w-full h-32 p-4 bg-white/5 rounded-2xl text-white text-sm resize-none outline-none border border-white/10 focus:border-cyan-500/50"
                />
                <div className="mt-3 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300">Snapshot</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-[11px] font-semibold text-cyan-300">{waterIntake}/{waterGoal}ml</span>
                    <span className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-[11px] font-semibold text-orange-300">Streak {streak} ngày</span>
                  </div>
                </div>
                {socialImagePreview && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                    <img src={socialImagePreview} alt="Ảnh xem trước" className="max-h-60 w-full object-cover" />
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => socialImageInputRef.current?.click()} className="px-4 py-4 bg-slate-800 text-cyan-300 font-bold rounded-2xl active:scale-95 transition-transform">
                    <Camera size={18} />
                  </button>
                  <input ref={socialImageInputRef} type="file" accept="image/*" onChange={handleSocialImagePicked} className="hidden" />
                  {socialImagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setSocialImageFile(null);
                        if (socialImagePreview.startsWith('blob:')) URL.revokeObjectURL(socialImagePreview);
                        setSocialImagePreview('');
                      }}
                      className="px-4 py-4 bg-slate-800 text-slate-300 font-bold rounded-2xl active:scale-95 transition-transform"
                    >
                      Xóa
                    </button>
                  )}
                  <button type="submit" className="flex-1 py-4 bg-cyan-500 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform">ĐĂNG NGAY</button>
                  <button type="button" onClick={() => setShowSocialComposer(false)} className="px-6 py-4 bg-slate-800 text-white font-bold rounded-2xl">Hủy</button>
                </div>
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
      </React.Suspense>
    </>
  );
}
