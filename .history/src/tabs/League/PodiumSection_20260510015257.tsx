import { useMemo } from 'react';
import { Crown, Flame, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LeagueEntry } from './types';

const podiumHeights = [130, 110, 90];

const MEDAL_ICONS = [Crown, Medal, Medal];
const METALLIC = [
