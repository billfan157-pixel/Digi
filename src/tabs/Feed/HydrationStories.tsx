import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
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
  isSocialLoading,
  onCreateStory,
  onSelectStory,
}: HydrationStoriesProps) => {
  const { t } = useTranslation();
  return (
    <div className="pt-2 pb-5">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-5 snap-x snap-mandatory">
        {/* Current User Story / Add Story */}
        <div className="flex flex-col items-center gap-2 shrink-0 snap-start">
          <button 
            type="button" 
            onClick={onCreateStory} 
            className="relative group active:scale-90 transition-transform duration-200"
          >
            <div className="w-[68px] h-[68px] rounded-full p-[2.5px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600">
               <div className="w-full h-full rounded-full bg-slate-950 p-[2px]">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar của bạn" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <span className="text-xl font-black text-slate-500">{(profile?.nickname || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
               </div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full border-[3px] border-slate-950 flex items-center justify-center text-slate-950 shadow-xl group-hover:bg-cyan-400 transition-colors">
              <Plus size={14} strokeWidth={4} />
            </div>
          </button>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest text-center">Bạn</p>
        </div>

        {isSocialLoading && !socialStories.length && (
          <>
            {[0, 1, 2].map(i => (
              <div key={`story-skel-${i}`} className="flex flex-col items-center gap-2 shrink-0 snap-start animate-pulse">
                <div className="w-[68px] h-[68px] rounded-full bg-white/5 border border-white/5" />
                <div className="w-10 h-2 bg-white/5 rounded" />
              </div>
            ))}
          </>
        )}

        {socialStories.map((story, index) => {
          const storyPct = getFallbackStoryPercent(story);
          
          return (
            <div 
              key={story.id || `story-${index}`} 
              className="group flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer active:scale-95 transition-all" 
              onClick={() => onSelectStory(index)}
            >
              <div className="relative">
                {/* Glow Effect for active stories */}
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className={`w-[68px] h-[68px] rounded-full p-[2.5px] transition-all ${
                  storyPct >= 100 
                    ? 'bg-gradient-to-tr from-emerald-400 to-teal-500' 
                    : 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600'
                }`}>
                  <div className="w-full h-full rounded-full bg-slate-950 p-[2px]">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                      {story.author?.avatar_url ? (
                        <img src={story.author.avatar_url} alt={t('feed.avatar_of_user', { name: story.author?.nickname || t('common.user') })} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <span className="text-xl font-black text-white">{(story.author?.nickname || 'U').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-white text-[10px] font-black uppercase tracking-widest w-[68px] text-center truncate">{story.author?.nickname || 'User'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
