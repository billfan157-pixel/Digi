import { Camera, Droplets, Sparkles } from 'lucide-react';
import type { Profile } from '../../models';

interface FeedComposerProps {
  profile: Profile | null;
  onOpenRitualSheet: () => void;
}

export const FeedComposer = ({
  profile,
  onOpenRitualSheet,
}: FeedComposerProps) => {
  const name = profile?.nickname || 'User';

  return (
    <div className="mx-4">
      <button
        type="button"
        onClick={onOpenRitualSheet}
        className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/20 hover:bg-slate-900/55 active:scale-[0.99]"
      >
        {/* glow */}
        <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-500 group-hover:bg-cyan-500/15" />

        <div className="relative flex items-center gap-3">
          {/* avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-800">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-slate-300">
                {name[0].toUpperCase()}
              </span>
            )}
          </div>

          {/* content */}
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-slate-300">
              Chia sẻ hydration moment...
            </p>

            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                <Camera size={10} />
                Ảnh
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-300">
                <Sparkles size={10} />
                Milestone
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <Droplets size={10} />
                Hydration
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};