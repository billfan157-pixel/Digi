import { Droplets, Sparkles } from 'lucide-react';
import type { Profile } from '../../models';

interface FeedComposerProps {
  profile: Profile | null;
  onOpenRitualSheet: () => void;
}

export const FeedComposer = ({ profile, onOpenRitualSheet }: FeedComposerProps) => (
  <div className="relative mx-4">
    <div
      onClick={onOpenRitualSheet}
      className="relative overflow-hidden bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-3xl p-5 shadow-sm cursor-pointer transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.08)] active:scale-[0.99] group"
    >
      {/* Subtle gradient background */}
      <div className="absolute -top-20 -right-10 w-40 h-40 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-500" />
      
      <div className="relative z-10 flex items-center gap-3">
        {/* Avatar circle */}
        <div className="shrink-0">
          <div className="w-11 h-11 rounded-xl bg-slate-800/70 border border-slate-700/60 overflow-hidden flex items-center justify-center shadow-sm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black text-slate-400">
                {(profile?.nickname || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Input hint */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
            Chia sẻ khoảnh khắc hydration...
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/8 border border-cyan-500/15">
              <Droplets size={10} className="text-cyan-400/70" />
              <span className="text-[9px] font-semibold text-cyan-400/70">Chụp ảnh</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/8 border border-orange-500/15">
            import { Camera, ChevronRight, Droplets, Sparkles } from 'lucide-react';
import type { Profile } from '../../models';

interface FeedComposerProps {
  profile: Profile | null;
  onOpenRitualSheet: () => void;
}

export const FeedComposer = ({ profile, onOpenRitualSheet }: FeedComposerProps) => {
  const displayName = profile?.nickname?.trim() || 'User';
  const initial = displayName[0]?.toUpperCase() || 'U';

  return (
    <div className="relative mx-4">
      <button
        type="button"
        onClick={onOpenRitualSheet}
        aria-label="Create a new hydration post"
        className="group relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/30 p-[1px] text-left shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/25 hover:shadow-[0_0_40px_rgba(6,182,212,0.12)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        <div className="relative overflow-hidden rounded-[27px] bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-slate-950/90 p-5 sm:p-6">
          <div className="pointer-events-none absolute -top-20 right-[-2rem] h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-500 group-hover:bg-cyan-500/15" />
          <div className="pointer-events-none absolute -bottom-20 left-[-3rem] h-40 w-40 rounded-full bg-blue-500/10 blur-3xl transition-all duration-500 group-hover:bg-blue-500/15" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="shrink-0">
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-inner shadow-black/20 ring-1 ring-white/5">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold tracking-wide text-slate-300">
                    {initial}
                  </span>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[15px] font-semibold text-slate-100">
                  {displayName}
                </p>
                <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  Compose
                </span>
              </div>

              <p className="mt-1 text-sm leading-6 text-slate-400 transition-colors group-hover:text-slate-300">
                Chia sẻ khoảnh khắc hydration, một cột mốc nhỏ, hoặc điều gì đó truyền cảm hứng hôm nay.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-2.5 py-1 text-[11px] font-medium text-cyan-300/90">
                  <Camera size={12} className="shrink-0" />
                  Ảnh
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/15 bg-orange-400/8 px-2.5 py-1 text-[11px] font-medium text-orange-300/90">
                  <Sparkles size={12} className="shrink-0" />
                  Mốc tiến bộ
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/8 px-2.5 py-1 text-[11px] font-medium text-emerald-300/90">
                  <Droplets size={12} className="shrink-0" />
                  Lan tỏa
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.08)] transition-all duration-300 group-hover:border-cyan-400/30 group-hover:bg-cyan-400/15 group-hover:text-cyan-200">
                <ChevronRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};  <span className="text-[9px] font-semibold text-orange-400/70">🔥 Cột mốc</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/8 border border-emerald-500/15">
              <span className="text-[9px] font-semibold text-emerald-400/70">🌊 Lan tỏa</span>
            </span>
          </div>
        </div>

        {/* Sparkle icon */}
        <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/15 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 transition-all">
          <Sparkles size={15} className="text-cyan-400/80 group-hover:text-cyan-300 transition-colors" />
        </div>
      </div>
    </div>
  </div>
);