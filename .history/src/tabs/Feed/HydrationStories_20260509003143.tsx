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
        <div className="flex flex-col items-center gap-1.5 shrink-0 snap-start">
          <div className="relative w-16 h-16">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="32" cy="32" r="30" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="188.5" strokeDashoffset={188.5 * (1 - profilePct / 100)} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-[4px] rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-900 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-slate-500">{(profile?.nickname || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button onClick={onCreateStory} className="absolute bottom-0 right-0 w-6 h-6 bg-cyan-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 active:scale-95 transition-all shadow-lg">
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
          <p className="text-slate-400 text-[11px] font-semibold w-16 text-center truncate mt-1">Bạn</p>
        </div>

        {socialStories.map((story, index) => {
          const storyPct = getFallbackStoryPercent(story);
          const storyDashOffset = 188.5 * (1 - storyPct / 100);
          const ringColor = storyPct >= 100 ? '#10b981' : storyPct >= 50 ? '#06b6d4' : '#f59e0b';

          return (
            <div key={story.id || `story-${index}`} className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer active:scale-95 transition-transform" onClick={() => onSelectStory(index)}>
              <div className="relative w-16 h-16">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="32" cy="32" r="30" fill="none" stroke={ringColor} strokeWidth="3" strokeDasharray="188.5" strokeDashoffset={storyDashOffset} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-[4px] rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-900 overflow-hidden">
                  {story.author?.avatar_url ? (
                    <img src={story.author.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-white">{(story.author?.nickname || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <p className="text-white text-[11px] font-bold w-16 text-center truncate mt-1">{story.author?.nickname || 'Người dùng'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
