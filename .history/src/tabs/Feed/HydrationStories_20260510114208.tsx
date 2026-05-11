import { Loader2, Plus } from 'lucide-react';
import { getFallbackStoryPercent } from '../../lib/feedUtils';
import type { Profile, SocialFeedPost } from '../../models';

interface HydrationStoriesProps {
  profile: Profile | null;
  socialStories: SocialFeedPost[];
  storyCount: number;
  isSocialLoading: boolean;
  onCreateStory: () => void;
  onSelectStory: (index: number) => void;
}

export const HydrationStories = ({
  profile,
  socialStories,
  storyCount,
  isSocialLoading,
  onCreateStory,
  onSelectStory,
}: HydrationStoriesProps) => {
  const profilePct = profile?.water_goal
    ? Math.min(100, ((profile.water_today || 0) / profile.water_goal) * 100)
    : 0;

  return (
    <div className="pt-1 pb-3 border-b border-white/5">
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white">Story uống nước</p>
          <p className="text-xs text-slate-500">{storyCount} vòng story đang hoạt động</p>
        </div>
        {isSocialLoading && <Loader2 size={16} className="text-slate-500 animate-spin" />}
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory">
        {isSocialLoading && !socialStories.length && (
          <>
            {[0, 1, 2, 3].map(i => (
              <div key={`story-skel-${i}`} className="flex flex-col items-center gap-1.5 shrink-0 snap-start animate-pulse">
                <div className="w-16 h-16 rounded-full bg-white/10" />
                <div className="w-12 h-2.5 bg-white/10 rounded mt-1" />
              </div>
            ))}
          </>
        )}
import { Loader2, Plus } from 'lucide-react';
import { getFallbackStoryPercent } from '../../lib/feedUtils';
import type { Profile, SocialFeedPost } from '../../models';

interface HydrationStoriesProps {
  profile: Profile | null;
  socialStories: SocialFeedPost[];
  storyCount: number;
  isSocialLoading: boolean;
  onCreateStory: () => void;
  onSelectStory: (index: number) => void;
}

export const HydrationStories = ({
  profile,
  socialStories,
  storyCount,
  isSocialLoading,
  onCreateStory,
  onSelectStory,
}: HydrationStoriesProps) => {
  const profilePct = profile?.water_goal
    ? Math.min(100, ((profile.water_today || 0) / profile.water_goal) * 100)
    : 0;

  return (
    <div className="pt-1 pb-3 border-b border-white/5">
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white">Story uống nước</p>
          <p className="text-xs text-slate-500">{storyCount} vòng story đang hoạt động</p>
        </div>
        {isSocialLoading && <Loader2 size={16} className="text-slate-500 animate-spin" />}
      </div>
      </div>
    </div>
  );
};
