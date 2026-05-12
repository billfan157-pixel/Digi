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
          <p className="text-sm font-black text-white">Drop</p>
          <p className="text-xs text-slate-500">
            {storyCount > 0 ? `${storyCount} vòng story đang hoạt động` : 'Chưa có story đang hoạt động'}
          </p>
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
        <div className="flex flex-col items-center gap-1.5 shrink-0 snap-start">
          <button type="button" onClick={onCreateStory} className="relative w-16 h-16 active:scale-95 transition-transform">
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
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-cyan-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 shadow-lg">
              <Plus size={14} strokeWidth={3} />
            </span>
          </button>
          <p className="text-slate-400 text-[11px] font-semibold w-16 text-center truncate mt-1">Bạn</p>
        </div>

        {!isSocialLoading && socialStories.length === 0 && (
          <button
            onClick={onCreateStory}
            className="min-h-16 flex flex-1 items-center justify-between rounded-2xl border border-cyan-500/15 bg-cyan-500/5 px-4 text-left active:scale-[0.99] transition-all"
          >
            <div>
              <p className="text-sm font-bold text-cyan-100">Tạo Drop đầu tiên</p>
              <p className="mt-0.5 text-xs text-slate-500">Chụp nhanh khoảnh khắc hôm nay.</p>
            </div>
            <Plus size={18} className="text-cyan-300" />
          </button>
        )}

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
