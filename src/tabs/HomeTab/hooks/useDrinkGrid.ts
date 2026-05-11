import { useState, useEffect, useCallback, useRef } from 'react';
import { AppStorage } from '@/lib/storage';
import type { DrinkPreset } from '@/models';

const DEFAULT_GRID_DRINKS: DrinkPreset[] = [
  { id: 'default-1', name: 'Nước lọc', amount: 250, factor: 1, icon: 'Droplet', color: 'cyan', bg: 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20' },
  { id: 'default-2', name: 'Cà phê', amount: 250, factor: 0.8, icon: 'Coffee', color: 'orange', bg: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20' },
  { id: 'default-3', name: 'Trà', amount: 250, factor: 0.9, icon: 'Coffee', color: 'emerald', bg: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' },
  { id: 'default-4', name: 'Nước ép', amount: 250, factor: 1, icon: 'Droplet', color: 'fuchsia', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20 hover:bg-fuchsia-500/20' },
  { id: 'default-5', name: 'Bia/Rượu', amount: 250, factor: -0.5, icon: 'Zap', color: 'red', bg: 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20' }
];

export function useDrinkGrid() {
  const [drinkGridList, setDrinkGridList] = useState<DrinkPreset[]>(() => {
    try { 
      const saved = AppStorage.getItem('digiwell_drink_grid'); 
      if (saved) {
        const parsed = JSON.parse(saved);
        const valid = parsed.filter((d: DrinkPreset) => d && d.id && String(d.id).trim() !== '');
        if (valid.length !== parsed.length) {
          AppStorage.setItem('digiwell_drink_grid', JSON.stringify(valid));
        }
        return valid;
      }
      const oldCustom = AppStorage.getItem('digiwell_custom_drinks'); 
      if (oldCustom) {
        const parsedOld = JSON.parse(oldCustom);
        const validOld = parsedOld.filter((d: DrinkPreset) => d && d.id && String(d.id).trim() !== '');
        return [...DEFAULT_GRID_DRINKS, ...validOld];
      }
      return DEFAULT_GRID_DRINKS;
    } catch {
      return DEFAULT_GRID_DRINKS;
    }
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSaveRef = useRef(false);

  const debouncedSave = useCallback((grid: DrinkPreset[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      AppStorage.setItem('digiwell_drink_grid', JSON.stringify(grid));
    }, 300);
  }, []);

  useEffect(() => {
    debouncedSave(drinkGridList);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [drinkGridList, debouncedSave]);

  const addDrink = useCallback((drink: DrinkPreset) => {
    setDrinkGridList(prev => [...prev, drink]);
  }, []);

  const updateDrink = useCallback((id: string, updates: Partial<DrinkPreset>) => {
    setDrinkGridList(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const deleteDrink = useCallback((id: string) => {
    setDrinkGridList(prev => prev.filter(d => d.id !== id));
  }, []);

  return { drinkGridList, addDrink, updateDrink, deleteDrink };
}