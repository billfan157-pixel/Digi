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
