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
}

export const FeedComposer = ({ profile, onOpenRitualSheet }: FeedComposerProps) => (
  <div className="px-4">
    <button
      onClick={onOpenRitualSheet}
      className="w-full glass-card flex items-center gap-3 p-3 hover:bg-white/[0.03] active:scale-[0.98] transition-all rounded-2xl border border-white/5 group"
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-white bg-slate-800 border border-slate-700 shrink-0 shadow-inner overflow-hidden">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{(profile?.nickname || 'U')[0].toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-slate-500 text-sm font-medium group-hover:text-slate-400 transition-colors">
          Thực hiện nghi thức hydration...
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {RITUAL_PREVIEWS.map((r, i) => {
            const Icon = r.icon;
            return (
              <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${r.bg} ${r.border} border`}>
                <Icon size={10} className={r.color} />
                <span className={`${r.color} text-[8px] font-bold`}>{r.label}</span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
        <Sparkles size={14} className="text-cyan-400" />
      </div>
    </button>
  </div>
);