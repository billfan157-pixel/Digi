import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import TabHeader from '@/components/layout/TabHeader';
import type { Profile, Battle } from '@/models';
import type { LeagueEntry } from '@/tabs/League/types';
import { useUIStore } from '@/store/useUIStore';
import { useArenaData } from '@/hooks/useArenaData';

import SeasonBanner from '@/tabs/Arena/SeasonBanner';
import MatchmakingOverlay from '@/tabs/Arena/MatchmakingOverlay';
import PostMatchSummary from '@/tabs/Arena/PostMatchSummary';
import BattleDetailModal from '@/tabs/Arena/BattleDetailModal';
import { GroupChallengesModal } from '@/components/modals/GroupChallengesModal';

import CompeteHero from '@/tabs/Compete/CompeteHero';
import QuickActionBar from '@/tabs/Compete/QuickActionBar';
import CompeteSubTabs from '@/tabs/Compete/CompeteSubTabs';
import BattlesView from '@/tabs/Compete/BattlesView';
import RankingView from '@/tabs/Compete/RankingView';
import ClubsView from '@/components/ClubsView';

interface CompeteTabProps {
  profile: Profile | null;
  leagueMode: 'public' | 'friends' | 'clubs';
  setLeagueMode: (mode: 'public' | 'friends' | 'clubs') => void;
  setShowAddFriend: (show: boolean) => void;
  getLeagueData: () => LeagueEntry[];
}

const CompeteTab = memo(function CompeteTab({
  profile,
  leagueMode,
  setLeagueMode,
  setShowAddFriend,
  getLeagueData,
}: CompeteTabProps) {
  const { t } = useTranslation();
  const subTab = useUIStore(s => s.competeSubTab);
  const setSubTab = useUIStore.getState().setCompeteSubTab;

  const arena = useArenaData(profile);
  const [showingRanking, setShowingRanking] = useState(false);

  const hasActiveBattle = arena.activeBattles.length > 0;

  return (
    <div className="animate-in slide-in-from-right duration-300 pb-12">
      {/* Dynamic tier glow background */}
      <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none blur-[100px] z-[-1]" />

      {/* Header */}
      <div className="mb-4">
        <TabHeader
          label="Compete"
          title={t('compete.title', 'Đấu Trường')}
          profile={profile}
          onAvatarClick={() => useUIStore.getState().setShowMainMenu(true)}
        />
      </div>

      {/* Season Banner */}
      <SeasonBanner userId={profile?.id} />

      {/* Unified Hero Stats */}
      <CompeteHero
        profile={profile}
        arenaStats={arena.stats}
        onShowRanking={() => setShowingRanking(true)}
      />

      {/* Quick Action Bar — always visible */}
      <QuickActionBar
        onBotDuel={arena.handleBotDuel}
        onQuickMatch={() => arena.handleEnterQueue('quick', 0)}
        onGroupChallenge={() => arena.setShowGroupChallenge(true)}
        isBotMatching={arena.isBotMatching}
        isQueuing={arena.isQueuing}
        hasActiveBattle={hasActiveBattle}
      />

      {/* Sub-tab navigation */}
      <CompeteSubTabs activeTab={subTab} onTabChange={setSubTab} />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {showingRanking && (
          <motion.div
            key="ranking"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <RankingView
              leagueMode={leagueMode as 'public' | 'friends'}
              setLeagueMode={(mode) => setLeagueMode(mode as 'public' | 'friends' | 'clubs')}
              setShowAddFriend={setShowAddFriend}
              getLeagueData={getLeagueData}
              profile={profile}
              onBack={() => setShowingRanking(false)}
            />
          </motion.div>
        )}

        {!showingRanking && subTab === 'battles' && (
          <motion.div
            key="battles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <BattlesView
              profile={profile}
              battles={arena.battles}
              activeBattles={arena.activeBattles}
              now={arena.now}
              selectedMode={arena.selectedMode}
              setSelectedMode={arena.setSelectedMode}
              onEnterQueue={arena.handleEnterQueue}
              isQueuing={arena.isQueuing}
              isLoading={arena.isLoading}
              onSelectBattle={(battle: Battle) => arena.setShowBattleDetail(battle)}
            />
          </motion.div>
        )}

        {!showingRanking && subTab === 'clubs' && (
          <motion.div
            key="clubs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {profile?.id ? (
              <div className="px-5 pb-6">
                <ClubsView userId={profile.id} />
              </div>
            ) : (
              <div className="px-5 py-16 flex flex-col items-center justify-center text-slate-500 gap-3 border border-dashed border-white/10 rounded-3xl">
                <p className="text-xs font-bold">{t('league.join_club_to_compete')}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <MatchmakingOverlay
        queueStatus={arena.queueStatus}
        profile={profile}
        onCancel={arena.handleCancelQueue}
        matchedData={arena.matchedData}
        onMatchedAnimationComplete={arena.handleMatchedAnimationComplete}
      />

      <PostMatchSummary
        isOpen={!!arena.showPostMatchResult}
        onClose={() => {
          arena.setShowPostMatchResult(null);
          arena.fetchArenaData();
        }}
        result={arena.showPostMatchResult}
      />

      <AnimatePresence>
        {arena.showBattleDetail && (
          <BattleDetailModal
            key="battle-detail-modal"
            battle={arena.showBattleDetail}
            profile={profile}
            now={arena.now}
            onClose={() => arena.setShowBattleDetail(null)}
            onActionComplete={() => arena.fetchArenaData()}
            onBattleResolved={arena.handleBattleResolved}
          />
        )}
      </AnimatePresence>

      <GroupChallengesModal
        isOpen={arena.showGroupChallenge}
        onClose={() => arena.setShowGroupChallenge(false)}
      />
    </div>
  );
});

export default CompeteTab;
