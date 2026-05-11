import { Camera, Sparkles } from 'lucide-react';
import type { Profile } from '../../models';

interface FeedComposerProps {
  profile: Profile | null;
  onOpenRitualSheet: () => void;
}

export const FeedComposer = ({ profile, onOpenRitualSheet }: FeedComposerProps) => {
  const name = profile?.nickname || 'User';
  const initial = name[0]?.toUpperCase() || 'U';

  return (
    <div className="mx-4">
      <button
        type="button"
        onClick={onOpenRitualSheet}
        className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-left shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/20 hover:bg-slate-900/70 active:scale-[0.99]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-800/80">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-slate-300">
                {initial}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {name}
            </p>
            <p className="truncate text-xs text-slate-400">
              Chia sẻ một hydration moment...
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                <Camera size={10} />
                Ảnh
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-300">
                <Sparkles size={10} />
                Mốc
              </span>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300 transition-colors group-hover:bg-cyan-400/15">
            Post
          </div>
        </div>
      </button>
    </div>
  );
};