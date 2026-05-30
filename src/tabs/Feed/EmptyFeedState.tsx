import { Filter, RotateCcw, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FeedFilter, FeedMode } from './types';
import { glassCard } from '../../styles/glass';

interface EmptyFeedStateProps {
  feedSearch: string;
  feedFilter: FeedFilter;
  friendCount: number;
  onFilterChange: (filter: FeedFilter) => void;
  onModeChange: (mode: FeedMode) => void;
  onOpenDiscoverPeople: () => void;
}

const EMPTY_STATE_BY_FILTER: Record<FeedFilter, { title: string; description: string }> = {
  all: {
    title: 'No posts yet',
    description: 'Be the first to post a Pulse today.',
  },
  checkins: {
    title: 'No Pulses yet',
    description: 'Share your water progress to stay connected with the community.',
  },
  drops: {
    title: 'No Drops yet',
    description: 'Drop here to share your location.',
  },
  milestones: {
    title: 'No Peaks yet',
    description: 'Keep your streak going to appear on the leaderboard.',
  },
  challenges: {
    title: 'No Duels yet',
    description: 'Create a Duel to start a new accountability challenge.',
  },
  photos: {
    title: 'No Proofs yet',
    description: 'Add photos to your Pulse to make it stand out.',
  },
};

export const EmptyFeedState = ({
  feedSearch,
  feedFilter,
  friendCount,
  onFilterChange,
  onModeChange,
  onOpenDiscoverPeople,
}: EmptyFeedStateProps) => {
  const { t } = useTranslation();
  const state = !feedSearch && friendCount === 0
    ? { title: t('feed.no_friends'), description: t('feed.add_friends_feed') }
    : feedSearch
    ? { title: t('feed.no_matching_posts'), description: t('feed.try_different_keyword') }
    : EMPTY_STATE_BY_FILTER[feedFilter];

  return (
    <div className={`mx-4 ${glassCard} rounded-3xl shadow-lg p-8 text-center mt-8 sm:mx-0`}>
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
        <Filter size={28} className="text-slate-500" />
      </div>
      <p className="text-white text-lg font-bold mb-2">{state.title}</p>
      <p className="text-slate-400 text-sm mb-6">{state.description}</p>
    <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row">
      <button onClick={() => { onFilterChange('all'); onModeChange('smart'); }} className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold active:scale-95 transition-all hover:bg-white/10">
        <RotateCcw size={15} />
        {t('feed.reset_feed')}
      </button>
      <button onClick={onOpenDiscoverPeople} className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 text-sm font-bold active:scale-95 transition-all hover:bg-cyan-500/25">
        <Users size={15} />
        {t('feed.discover_people')}
      </button>
      </div>
    </div>
  );
};
