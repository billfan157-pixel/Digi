import { useState, memo } from 'react';
import { Camera, Lightbulb, BarChart3, MessageCircle, Image } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { Profile } from '../../models';
import type { SocialComposerKind } from './types';
import { QuickStatusComposer } from './QuickStatusComposer';
import { QuickTipComposer } from './QuickTipComposer';
import { QuickPollComposer } from './QuickPollComposer';

interface FeedComposerProps {
  profile: Profile | null;
  onOpenRitualSheet: () => void;
}

interface QuickAction {
  kind: SocialComposerKind;
  label: string;
  icon: typeof Camera;
  gradient: string;
  borderColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { kind: 'status', label: 'Status', icon: MessageCircle, gradient: 'from-cyan-500/20 to-blue-500/20', borderColor: 'border-cyan-500/30' },
  { kind: 'photo', label: 'Khoảnh khắc', icon: Image, gradient: 'from-violet-500/20 to-purple-500/20', borderColor: 'border-violet-500/30' },
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