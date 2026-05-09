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
  const [shouldLogOnSave, setShouldLogOnSave] = useState(true);

  const resetCustom = () => {
    setEditingDrinkId(null);
    setCustomName('');
    setCustomVolume(250);
    setCustomFactor(1.0);
    setShouldLogOnSave(true);
  };

  const handleSaveCustom = () => {
    if (!customName.trim()) {
      toast.error(t('home.enter_drink_name'));
      return;
    }
    if (editingDrinkId) {
      updateDrink(editingDrinkId, { name: customName.trim(), amount: customVolume, factor: customFactor });
      toast.success(t('home.drink_updated'));
    } else {
      addDrink({
        id: `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: customName.trim(),
        amount: customVolume,
        factor: customFactor,
        icon: 'Droplet',
        bg: 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20',
        color: 'text-indigo-400',
      });
      if (shouldLogOnSave) {
        handleAddWater(customVolume, customFactor, customName.trim());
      } else {
        toast.success('Đã lưu vào menu đồ uống.');
      }
    }
    setIsCustomMode(false);
    onClose();
  };

  const drinks = drinkGridList.length > 0 ? drinkGridList : DEFAULT_GRID_DRINKS;

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="drink-menu-modal" className="fixed inset-0 z-[100] flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={() => { onClose(); resetCustom(); }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) { onClose(); resetCustom(); }
            }}
            className="relative w-full bg-gradient-to-br from-slate-900 to-slate-950 backdrop-blur-2xl border-t border-white/15 rounded-t-[2rem] shadow-2xl p-6 pt-5"
          >
            <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-5 shrink-0" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-black text-lg">
                  {isCustomMode ? t('home.create_new_drink') : t('home.add_drink')}
                </h2>
                <p className="text-slate-400 text-xs mt-2 opacity-75">
                  {isCustomMode ? t('home.save_for_quick_use') : t('home.choose_drink_type')}
                </p>
              </div>
              <button
                onClick={() => { onClose(); resetCustom(); }}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white active:scale-90 transition-all border border-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isCustomMode ? (
                <motion.div
                  key="custom-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-4 mb-2"
                >
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={t('home.drink_name_placeholder')}
                    className="w-full bg-slate-800/60 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  />
                  <div className="bg-slate-800/60 backdrop-blur-md border border-white/15 rounded-2xl p-4.5">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('volume')}</label>
                      <span className="text-2xl font-black text-cyan-400 bg-cyan-500/15 px-3 py-1 rounded-lg">{customVolume}ml</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="10"
                      value={customVolume}
                      onChange={(e) => setCustomVolume(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-2.5 bg-slate-900/60 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur-md border border-white/15 rounded-2xl p-4.5">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('home.hydration_factor')}</label>
                      <span className="text-lg font-black text-white bg-cyan-500/15 px-3 py-1 rounded-lg">{customFactor.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="-1.0"
                      max="2.0"
                      step="0.1"
                      value={customFactor}
                      onChange={(e) => setCustomFactor(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-2.5 bg-slate-900/60 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => setIsCustomMode(false)}
                      className="flex-1 py-4 rounded-2xl bg-white/10 border border-white/20 text-slate-200 font-semibold hover:bg-white/15 active:scale-95 transition-all"
                    >
                      {t('home.back')}
                    </button>
                    <button
                      onClick={handleSaveCustom}
