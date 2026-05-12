import { Plus, Users } from 'lucide-react';
import type { Profile, SocialFeedPost } from '../../models';
import type { CloseCircleMember } from '../../lib/social';

interface CloseCircleRailProps {
  profile: Profile | null;
  members: CloseCircleMember[];
  stories: SocialFeedPost[];
  isLoading: boolean;
  onAddPeople: () => void;
  onSelectStory: (index: number) => void;
}

const getProgress = (waterToday?: number | null, waterGoal?: number | null) => {
  const goal = Math.max(waterGoal || 0, 0);
  if (!goal) return 0;
  return Math.min(100, Math.round(((waterToday || 0) / goal) * 100));
};

export function CloseCircleRail({
  profile,
  members,
  stories,
  isLoading,
  onAddPeople,
  onSelectStory,
}: CloseCircleRailProps) {
  const storyIndexByAuthor = new Map(stories.map((story, index) => [story.author_id, index]));
  const profileProgress = getProgress(profile?.water_today, profile?.water_goal);

  return (
    <section className="mx-4 rounded-3xl border border-white/5 bg-slate-900/45 p-4 shadow-lg backdrop-blur-sm sm:mx-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Close Circle</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {members.length > 0 ? `${members.length}/12 người giữ nhịp cùng bạn` : 'Thêm 3 bạn thân để Feed thật hơn'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPeople}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-bold text-cyan-300 active:scale-95"
        >
          <Plus size={13} />
          Thêm
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        <div className="w-20 shrink-0 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-cyan-400/30 bg-slate-950">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-black text-cyan-100">{(profile?.nickname || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <p className="mt-2 truncate text-[11px] font-bold text-white">Bạn</p>
          <p className="text-[10px] font-semibold text-cyan-300">{profileProgress}%</p>
        </div>

        {isLoading && members.length === 0 && (
          <>
            {[0, 1, 2].map(item => (
              <div key={item} className="h-[92px] w-20 shrink-0 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </>
        )}

        {!isLoading && members.length === 0 && (
          <button
            type="button"
            onClick={onAddPeople}
            className="flex min-h-[92px] min-w-[190px] items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 text-left active:scale-[0.99]"
          >
            <Users size={18} className="text-slate-500" />
            <div>
              <p className="text-sm font-bold text-slate-200">Tạo Circle đầu tiên</p>
              <p className="mt-1 text-xs text-slate-500">Pulse và Drop chỉ nên dành cho người thân.</p>
            </div>
          </button>
        )}

        {members.map(member => {
          const progress = getProgress(member.water_today, member.water_goal);
          const storyIndex = storyIndexByAuthor.get(member.id);
          const hasDrop = typeof storyIndex === 'number';
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                if (hasDrop) onSelectStory(storyIndex);
              }}
              className={`w-20 shrink-0 rounded-2xl border p-3 text-center active:scale-95 ${
                hasDrop ? 'border-sky-500/30 bg-sky-500/10' : 'border-white/5 bg-slate-950/30'
              }`}
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-900">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-white">{member.nickname.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <p className="mt-2 truncate text-[11px] font-bold text-white">{member.nickname}</p>
              <p className={`text-[10px] font-semibold ${progress >= 100 ? 'text-emerald-300' : 'text-cyan-300'}`}>
                {hasDrop ? 'Drop' : `${progress}%`}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
