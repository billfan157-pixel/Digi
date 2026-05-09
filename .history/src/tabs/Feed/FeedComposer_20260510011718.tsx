import { RefObject } from 'react';
import { Droplets, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
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
              <span className="text-[9px] font-semibold text-orange-400/70">🔥 Cột mốc</span>
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