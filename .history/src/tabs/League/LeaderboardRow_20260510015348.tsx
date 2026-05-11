import { Crown, Flame, Sparkles, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import StreakTierBadge from '../../components/StreakTierBadge';
import type { LeagueEntry, RankInfo } from './types';

interface LeaderboardRowProps {
  item: LeagueEntry;
  actualRank: number;
  rankInfo: RankInfo;
  gap: number;
  isPremium: boolean;
}

export const LeaderboardRow = ({ item, actualRank, rankInfo, gap, isPremium }: LeaderboardRowProps) => {
  const isMe = item.isMe;
  const isHotGap = gap > 0 && gap < 500;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(actualRank * 0.02, 0.2) }}
      className={`group relative flex items-center p-3.5 rounded-2xl backdrop-blur-md border transition-all duration-300 overflow-hidden min-h-[72px] active:scale-[0.99] ${
        isMe
          ? isPremium
