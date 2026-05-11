import { useMemo } from 'react';
import { Crown, Flame, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LeagueEntry } from './types';

const podiumHeights = [130, 110, 90];

const MEDAL_ICONS = [Crown, Medal, Medal];
const METALLIC = [
  { border: 'border-yellow-400/60', bg: 'from-amber-400/25 via-yellow-500/12 to-amber-600/15', glow: 'shadow-[0_-6px_25px_rgba(250,204,21,0.2)]', rankBg: 'from-yellow-300 to-amber-500', rankText: 'text-amber-950', nameColor: 'text-yellow-400', wpColor: 'text-yellow-400', iconRank: 0 },
  { border: 'border-slate-300/40', bg: 'from-slate-300/15 via-slate-400/8 to-slate-500/12', glow: 'shadow-[0_-4px_15px_rgba(203,213,225,0.1)]', rankBg: 'from-slate-200 to-slate-400', rankText: 'text-slate-800', nameColor: 'text-slate-300', wpColor: 'text-slate-300', iconRank: 1 },
