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
  { id: 'default-4', name: 'Nước ép', amount: 250, factor: 1, icon: 'Droplet', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20 hover:bg-fuchsia-500/20', color: 'text-fuchsia-400' },
  { id: 'default-5', name: 'Bia/Rượu', amount: 250, factor: -0.5, icon: 'Wine', bg: 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20', color: 'text-rose-400' },
];

const renderIcon = (iconName: string, props?: any) => {
  const icons: Record<string, React.ReactNode> = {
    Droplet: <Droplet {...props} />,
    Coffee: <Coffee {...props} />,
    Wine: <Wine {...props} />,
    Activity: <Activity {...props} />,
    Zap: <Zap {...props} />,
  };
  return icons[iconName] || icons.Droplet;
};

export default function DrinkMenuModal({ isOpen, onClose, handleAddWater }: DrinkMenuModalProps) {
  const { t } = useTranslation();
  const { drinkGridList, addDrink, updateDrink, deleteDrink } = useDrinkGrid();

  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customVolume, setCustomVolume] = useState(250);
  const [customFactor, setCustomFactor] = useState(1.0);
  const [editingDrinkId, setEditingDrinkId] = useState<string | null>(null);
