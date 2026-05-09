import { useMemo } from 'react';
import { Crown, Flame, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LeagueEntry } from './types';

const podiumHeights = [130, 110, 90];

const MEDAL_ICONS = [Crown, Medal, Medal];
const METALLIC = [
  { border: 'border-yellow-400/60', bg: 'from-amber-400/25 via-yellow-500/12 to-amber-600/15', glow: 'shadow-[0_-6px_25px_rgba(250,204,21,0.2)]', rankBg: 'from-yellow-300 to-amber-500', rankText: 'text-amber-950', nameColor: 'text-yellow-400', wpColor: 'text-yellow-400', iconRank: 0 },
