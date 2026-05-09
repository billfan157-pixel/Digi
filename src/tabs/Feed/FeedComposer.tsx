import { Share2, Swords } from 'lucide-react';
import type { Profile } from '../../models';
import type { SocialComposerKind } from './types';

interface FeedComposerProps {
  profile: Profile | null;
  openSocialComposer: (kind: SocialComposerKind) => void;
}

export const FeedComposer = ({ profile, openSocialComposer }: FeedComposerProps) => (
  <div className="px-4">
    <div className="glass-card flex items-center gap-2 sm:gap-3 p-2 rounded-full">
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white bg-slate-800 border border-slate-700 shrink-0 shadow-inner">
        {(profile?.nickname || 'U')[0].toUpperCase()}
      </div>
      <button onClick={() => openSocialComposer('status')} className="flex-1 h-10 bg-transparent text-slate-400 text-sm font-medium text-left px-2 outline-none hover:text-slate-300 transition-colors">
        Hôm nay bạn cảm thấy thế nào?
      </button>
      <div className="flex items-center gap-1.5 pr-1">
        <button onClick={() => openSocialComposer('progress')} className="w-9 h-9 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 active:scale-95 transition-transform shadow-sm" title="Báo cáo tiến độ">
          <Share2 size={14} />
        </button>
        <button onClick={() => openSocialComposer('challenge')} className="w-9 h-9 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center hover:bg-purple-500/20 active:scale-95 transition-transform shadow-sm" title="Tạo kèo thách đấu">
          <Swords size={14} />
        </button>
      </div>
    </div>
  </div>
);
