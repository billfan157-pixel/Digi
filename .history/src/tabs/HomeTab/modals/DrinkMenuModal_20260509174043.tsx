import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, X, Edit2, Droplet, Coffee, Wine, Activity, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDrinkGrid } from '../hooks/useDrinkGrid';

interface DrinkMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleAddWater: (amount: number, factor: number, name: string) => Promise<void>;
}

interface GridDrink {
  id: string;
  name: string;
  amount: number;
  factor: number;
  icon: string;
  bg: string;
  color: string;
}

const DEFAULT_GRID_DRINKS: GridDrink[] = [
  { id: 'default-1', name: 'Nước lọc', amount: 250, factor: 1, icon: 'Droplet', bg: 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20', color: 'text-cyan-400' },
  { id: 'default-2', name: 'Cà phê', amount: 250, factor: 0.8, icon: 'Coffee', bg: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20', color: 'text-orange-400' },
  { id: 'default-3', name: 'Trà', amount: 250, factor: 0.9, icon: 'Coffee', bg: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20', color: 'text-emerald-400' },
